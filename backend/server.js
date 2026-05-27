
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'ecommerce_teccart',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});
const dbp = db.promise();

db.getConnection((err, conn) => {
  if (err) console.error('MySQL connection failed:', err);
  else console.log('MySQL connected');
  if (conn) conn.release();
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send('Stripe webhook not configured');
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session?.metadata?.orderId;
    if (orderId) {
      try {
        await dbp.query('UPDATE Facture SET statut_paiement=? WHERE id_commande=?', ['Paye', orderId]);
        await dbp.query('UPDATE Commande SET statut=? WHERE id_commande=?', ['Payee', orderId]);
      } catch (err) {
        return res.status(500).send('Database update failed');
      }
    }
  }

  return res.json({ received: true });
});

app.use(express.json());
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const signToken = (client) =>
  jwt.sign({ id_client: client.id_client, email: client.email }, JWT_SECRET, { expiresIn: '7d' });

const authRequired = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminRequired = (req, res, next) => {
  if (!req.user?.email) {
    return res.status(403).json({ message: 'Admin only' });
  }
  if (!ADMIN_EMAILS.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ message: 'Admin only' });
  }
  return next();
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      mot_de_passe,
      telephone,
      adresse,
      ville,
      code_postal
    } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [existing] = await dbp.query('SELECT id_client FROM Client WHERE email=?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const [result] = await dbp.query(
      'INSERT INTO Client (nom, prenom, email, mot_de_passe, telephone, adresse, ville, code_postal) VALUES (?,?,?,?,?,?,?,?)',
      [nom, prenom, email, hash, telephone || null, adresse || null, ville || null, code_postal || null]
    );

    const user = {
      id_client: result.insertId,
      nom,
      prenom,
      email,
      telephone: telephone || null,
      adresse: adresse || null,
      ville: ville || null,
      code_postal: code_postal || null
    };

    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const [rows] = await dbp.query('SELECT * FROM Client WHERE email=?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userRow = rows[0];
    const match = await bcrypt.compare(mot_de_passe, userRow.mot_de_passe);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = {
      id_client: userRow.id_client,
      nom: userRow.nom,
      prenom: userRow.prenom,
      email: userRow.email,
      telephone: userRow.telephone,
      adresse: userRow.adresse,
      ville: userRow.ville,
      code_postal: userRow.code_postal
    };

    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const [rows] = await dbp.query(
      'SELECT id_client, nom, prenom, email, telephone, adresse, ville, code_postal, date_creation FROM Client WHERE id_client=?',
      [req.user.id_client]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

app.put('/api/auth/me', authRequired, async (req, res) => {
  try {
    const fields = {
      nom: req.body.nom,
      prenom: req.body.prenom,
      email: req.body.email,
      telephone: req.body.telephone,
      adresse: req.body.adresse,
      ville: req.body.ville,
      code_postal: req.body.code_postal
    };

    const updates = [];
    const values = [];
    Object.keys(fields).forEach((key) => {
      if (fields[key] !== undefined) {
        updates.push(`${key}=?`);
        values.push(fields[key] || null);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No changes provided' });
    }

    if (fields.email) {
      const [existing] = await dbp.query(
        'SELECT id_client FROM Client WHERE email=? AND id_client<>?',
        [fields.email, req.user.id_client]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Email already exists' });
      }
    }

    values.push(req.user.id_client);
    await dbp.query(`UPDATE Client SET ${updates.join(', ')} WHERE id_client=?`, values);

    const [rows] = await dbp.query(
      'SELECT id_client, nom, prenom, email, telephone, adresse, ville, code_postal, date_creation FROM Client WHERE id_client=?',
      [req.user.id_client]
    );
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    const clauses = [];
    const params = [];
    if (search) {
      clauses.push('(nom LIKE ? OR description LIKE ? OR categorie LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      clauses.push('categorie = ?');
      params.push(category);
    }

    let sql = 'SELECT * FROM Produit';
    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
    sql += ' ORDER BY date_ajout DESC';

    const [result] = await dbp.query(sql, params);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [result] = await dbp.query('SELECT * FROM Produit WHERE id_produit=?', [req.params.id]);
    if (!result || result.length === 0) return res.status(404).json({ message: 'Product not found' });
    return res.json(result[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

// Admin products
app.post('/api/admin/products', authRequired, adminRequired, async (req, res) => {
  try {
    const { nom, description, prix, stock, image, categorie } = req.body;
    if (!nom || prix === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [result] = await dbp.query(
      'INSERT INTO Produit (nom, description, prix, stock, image, categorie) VALUES (?,?,?,?,?,?)',
      [nom, description || null, prix, Number(stock || 0), image || null, categorie || null]
    );

    const [rows] = await dbp.query('SELECT * FROM Produit WHERE id_produit=?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Create failed', error: err.message });
  }
});

app.put('/api/admin/products/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { nom, description, prix, stock, image, categorie } = req.body;
    const updates = [];
    const values = [];

    if (nom !== undefined) {
      updates.push('nom=?');
      values.push(nom);
    }
    if (description !== undefined) {
      updates.push('description=?');
      values.push(description || null);
    }
    if (prix !== undefined) {
      updates.push('prix=?');
      values.push(prix);
    }
    if (stock !== undefined) {
      updates.push('stock=?');
      values.push(Number(stock || 0));
    }
    if (image !== undefined) {
      updates.push('image=?');
      values.push(image || null);
    }
    if (categorie !== undefined) {
      updates.push('categorie=?');
      values.push(categorie || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No changes provided' });
    }

    values.push(req.params.id);
    await dbp.query(`UPDATE Produit SET ${updates.join(', ')} WHERE id_produit=?`, values);

    const [rows] = await dbp.query('SELECT * FROM Produit WHERE id_produit=?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

app.delete('/api/admin/products/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const [result] = await dbp.query('DELETE FROM Produit WHERE id_produit=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

// Orders
app.post('/api/orders', authRequired, async (req, res) => {
  const { items, livraison, mode_paiement } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }
  if (!livraison || !livraison.adresse_livraison || !livraison.ville_livraison || !livraison.code_postal_livraison) {
    return res.status(400).json({ message: 'Missing delivery info' });
  }

  const conn = await dbp.getConnection();
  try {
    await conn.beginTransaction();
    const ids = items.map((i) => i.id_produit);
    const [products] = await conn.query(
      'SELECT id_produit, nom, prix, stock FROM Produit WHERE id_produit IN (?)',
      [ids]
    );

    let total = 0;
    for (const item of items) {
      const qty = Number(item.quantite || 0);
      const product = products.find((p) => p.id_produit === item.id_produit);
      if (!product) {
        throw new Error('Product not found');
      }
      if (qty <= 0) {
        throw new Error('Invalid quantity');
      }
      if (product.stock < qty) {
        throw new Error('Insufficient stock');
      }
      total += Number(product.prix) * qty;
    }

    const [orderResult] = await conn.query(
      'INSERT INTO Commande (id_client, total, statut) VALUES (?,?,?)',
      [req.user.id_client, total, 'En attente']
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      const product = products.find((p) => p.id_produit === item.id_produit);
      const qty = Number(item.quantite || 0);
      await conn.query(
        'INSERT INTO Ligne_Commande (id_commande, id_produit, quantite, prix_unitaire) VALUES (?,?,?,?)',
        [orderId, item.id_produit, qty, product.prix]
      );
      await conn.query('UPDATE Produit SET stock = stock - ? WHERE id_produit=?', [qty, item.id_produit]);
    }

    const paymentMode = mode_paiement || 'Simulation';
    const paymentStatus = paymentMode === 'Stripe' ? 'Non payé' : 'Paye';
    const orderStatus = paymentMode === 'Stripe' ? 'En attente' : 'Payee';

    await conn.query('UPDATE Commande SET statut=? WHERE id_commande=?', [orderStatus, orderId]);

    await conn.query(
      'INSERT INTO Facture (id_commande, montant_total, mode_paiement, statut_paiement) VALUES (?,?,?,?)',
      [orderId, total, paymentMode, paymentStatus]
    );

    await conn.query(
      'INSERT INTO Livraison (id_commande, adresse_livraison, ville_livraison, code_postal_livraison, date_livraison_prevue, statut_livraison) VALUES (?,?,?,?, DATE_ADD(CURDATE(), INTERVAL 3 DAY), ?)',
      [
        orderId,
        livraison.adresse_livraison,
        livraison.ville_livraison,
        livraison.code_postal_livraison,
        'Preparation'
      ]
    );

    await conn.commit();
    return res.json({ id_commande: orderId });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ message: 'Order failed', error: err.message });
  } finally {
    conn.release();
  }
});

app.get('/api/orders', authRequired, async (req, res) => {
  try {
    const [orders] = await dbp.query(
      'SELECT * FROM Commande WHERE id_client=? ORDER BY date_commande DESC',
      [req.user.id_client]
    );
    if (orders.length === 0) return res.json([]);
    const ids = orders.map((o) => o.id_commande);
    const [lines] = await dbp.query(
      'SELECT lc.*, p.nom, p.image FROM Ligne_Commande lc JOIN Produit p ON p.id_produit = lc.id_produit WHERE lc.id_commande IN (?)',
      [ids]
    );
    const [factures] = await dbp.query('SELECT * FROM Facture WHERE id_commande IN (?)', [ids]);

    const byOrder = {};
    lines.forEach((line) => {
      if (!byOrder[line.id_commande]) byOrder[line.id_commande] = [];
      byOrder[line.id_commande].push(line);
    });

    const byInvoice = {};
    factures.forEach((facture) => {
      byInvoice[facture.id_commande] = facture;
    });

    const result = orders.map((o) => ({
      ...o,
      lignes: byOrder[o.id_commande] || [],
      facture: byInvoice[o.id_commande] || null
    }));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

app.get('/api/orders/:id', authRequired, async (req, res) => {
  try {
    const [orders] = await dbp.query(
      'SELECT * FROM Commande WHERE id_commande=? AND id_client=?',
      [req.params.id, req.user.id_client]
    );
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    const [lines] = await dbp.query(
      'SELECT lc.*, p.nom, p.image FROM Ligne_Commande lc JOIN Produit p ON p.id_produit = lc.id_produit WHERE lc.id_commande=?',
      [req.params.id]
    );
    const [factures] = await dbp.query('SELECT * FROM Facture WHERE id_commande=?', [req.params.id]);
    const [livraison] = await dbp.query('SELECT * FROM Livraison WHERE id_commande=?', [req.params.id]);

    return res.json({
      ...orders[0],
      lignes: lines,
      facture: factures[0] || null,
      livraison: livraison[0] || null
    });
  } catch (err) {
    return res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

app.get('/api/orders/:id/invoice', authRequired, async (req, res) => {
  try {
    const [orders] = await dbp.query(
      'SELECT id_commande FROM Commande WHERE id_commande=? AND id_client=?',
      [req.params.id, req.user.id_client]
    );
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    const [invoice] = await dbp.query('SELECT * FROM Facture WHERE id_commande=?', [req.params.id]);
    if (invoice.length === 0) return res.status(404).json({ message: 'Invoice not found' });
    return res.json(invoice[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

app.get('/api/orders/:id/delivery', authRequired, async (req, res) => {
  try {
    const [orders] = await dbp.query(
      'SELECT id_commande FROM Commande WHERE id_commande=? AND id_client=?',
      [req.params.id, req.user.id_client]
    );
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    const [delivery] = await dbp.query('SELECT * FROM Livraison WHERE id_commande=?', [req.params.id]);
    if (delivery.length === 0) return res.status(404).json({ message: 'Delivery not found' });
    return res.json(delivery[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

// Stripe payment
app.post('/api/payments/stripe/checkout', authRequired, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Missing orderId' });

    const [orders] = await dbp.query(
      'SELECT id_commande, total FROM Commande WHERE id_commande=? AND id_client=?',
      [orderId, req.user.id_client]
    );
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    const [lines] = await dbp.query(
      'SELECT lc.quantite, lc.prix_unitaire, p.nom FROM Ligne_Commande lc JOIN Produit p ON p.id_produit = lc.id_produit WHERE lc.id_commande=?',
      [orderId]
    );

    const lineItems = lines.map((line) => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: line.nom
        },
        unit_amount: Math.round(Number(line.prix_unitaire) * 100)
      },
      quantity: Number(line.quantite)
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${FRONTEND_URL}/payment-success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-cancel?orderId=${orderId}`,
      metadata: {
        orderId: String(orderId),
        clientId: String(req.user.id_client)
      }
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ message: 'Stripe checkout failed', error: err.message });
  }
});

app.post('/api/payments/stripe/confirm', authRequired, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }
    const { orderId, sessionId } = req.body;
    if (!orderId || !sessionId) {
      return res.status(400).json({ message: 'Missing orderId or sessionId' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const [orders] = await dbp.query(
      'SELECT id_commande FROM Commande WHERE id_commande=? AND id_client=?',
      [orderId, req.user.id_client]
    );
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    await dbp.query('UPDATE Facture SET statut_paiement=? WHERE id_commande=?', ['Paye', orderId]);
    await dbp.query('UPDATE Commande SET statut=? WHERE id_commande=?', ['Payee', orderId]);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Stripe confirm failed', error: err.message });
  }
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => console.log(`Backend running on ${port}`));
}

module.exports = app;
