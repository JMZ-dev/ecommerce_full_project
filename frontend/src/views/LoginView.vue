<template>
  <div class="container py-4" style="max-width: 520px;">
    <h2 class="mb-3">Connexion</h2>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <form @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input v-model.trim="email" type="email" class="form-control" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Mot de passe</label>
        <input v-model.trim="motDePasse" type="password" class="form-control" required />
      </div>
      <button class="btn btn-primary w-100" :disabled="loading">
        {{ loading ? 'Chargement...' : 'Se connecter' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { setAuth } from '../state/auth'

const router = useRouter()
const email = ref('')
const motDePasse = ref('')
const error = ref('')
const loading = ref(false)

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/login', {
      email: email.value,
      mot_de_passe: motDePasse.value
    })
    setAuth(res.data.user, res.data.token)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>
