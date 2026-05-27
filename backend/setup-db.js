const mysql = require('mysql2/promise');

const config = {
  host: 'teccart-mysql-cazawi0905-c1b7.c.aivencloud.com',
  port: 21742,
  user: 'avnadmin',
  password: process.env.DB_PASSWORD,
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
};

const schema = `
CREATE TABLE IF NOT EXISTS Client (
  id_client     INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe  VARCHAR(255) NOT NULL,
  telephone     VARCHAR(20),
  adresse       VARCHAR(255),
  ville         VARCHAR(100),
  code_postal   VARCHAR(20),
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Produit (
  id_produit  INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(200) NOT NULL,
  description TEXT,
  prix        DECIMAL(10,2) NOT NULL,
  stock       INT NOT NULL DEFAULT 0,
  image       VARCHAR(255),
  categorie   VARCHAR(100),
  date_ajout  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Commande (
  id_commande   INT AUTO_INCREMENT PRIMARY KEY,
  id_client     INT NOT NULL,
  total         DECIMAL(10,2) NOT NULL,
  statut        VARCHAR(50) NOT NULL DEFAULT 'En attente',
  date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_client) REFERENCES Client(id_client)
);

CREATE TABLE IF NOT EXISTS Ligne_Commande (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  id_commande   INT NOT NULL,
  id_produit    INT NOT NULL,
  quantite      INT NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_commande) REFERENCES Commande(id_commande),
  FOREIGN KEY (id_produit)  REFERENCES Produit(id_produit)
);

CREATE TABLE IF NOT EXISTS Facture (
  id_facture      INT AUTO_INCREMENT PRIMARY KEY,
  id_commande     INT NOT NULL,
  montant_total   DECIMAL(10,2) NOT NULL,
  mode_paiement   VARCHAR(50),
  statut_paiement VARCHAR(50) DEFAULT 'Non paye',
  FOREIGN KEY (id_commande) REFERENCES Commande(id_commande)
);

CREATE TABLE IF NOT EXISTS Livraison (
  id_livraison          INT AUTO_INCREMENT PRIMARY KEY,
  id_commande           INT NOT NULL,
  adresse_livraison     VARCHAR(255) NOT NULL,
  ville_livraison       VARCHAR(100) NOT NULL,
  code_postal_livraison VARCHAR(20)  NOT NULL,
  date_livraison_prevue DATE,
  statut_livraison      VARCHAR(50) DEFAULT 'Preparation',
  FOREIGN KEY (id_commande) REFERENCES Commande(id_commande)
);
`;

async function setup() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to Aiven MySQL!');

  const tables = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of tables) {
    await conn.query(sql);
    const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
    if (match) console.log(`✅ Table "${match[1]}" created`);
  }

  await conn.end();
  console.log('\n🎉 Done! All tables are ready.');
}

setup().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
