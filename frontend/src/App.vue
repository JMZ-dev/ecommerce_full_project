
<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div class="container">
        <router-link class="navbar-brand" to="/">Jshop</router-link>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMain"
          aria-controls="navMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMain">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Produits</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/orders">Commandes</router-link>
            </li>
            <li v-if="showAdmin" class="nav-item">
              <router-link class="nav-link" to="/admin/products">Admin</router-link>
            </li>
          </ul>
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            <li class="nav-item">
              <router-link class="nav-link" to="/cart">Panier ({{ cartCount }})</router-link>
            </li>
            <li v-if="!auth.user" class="nav-item">
              <router-link class="nav-link" to="/login">Connexion</router-link>
            </li>
            <li v-if="!auth.user" class="nav-item">
              <router-link class="nav-link" to="/register">Inscription</router-link>
            </li>
            <li v-if="auth.user" class="nav-item">
              <router-link class="nav-link" to="/profile">Profil</router-link>
            </li>
            <li v-if="auth.user" class="nav-item">
              <button class="btn btn-sm btn-outline-secondary ms-lg-2" @click="logout">
                Deconnexion
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthState, clearAuth } from './state/auth'
import { useCartState } from './state/cart'
import { adminEmails } from './config'

const auth = useAuthState()
const cart = useCartState()
const cartCount = computed(() => cart.items.reduce((sum, i) => sum + Number(i.quantite || 0), 0))
const showAdmin = computed(() =>
  Boolean(auth.user?.email && adminEmails.includes(auth.user.email.toLowerCase()))
)

const logout = () => {
  clearAuth()
}
</script>
