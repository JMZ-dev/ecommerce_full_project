<template>
  <div class="container py-4" style="max-width: 640px;">
    <h2 class="mb-3">Creation de compte</h2>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <form @submit.prevent="submit" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Nom</label>
        <input v-model.trim="form.nom" type="text" class="form-control" required />
      </div>
      <div class="col-md-6">
        <label class="form-label">Prenom</label>
        <input v-model.trim="form.prenom" type="text" class="form-control" required />
      </div>
      <div class="col-12">
        <label class="form-label">Email</label>
        <input v-model.trim="form.email" type="email" class="form-control" required />
      </div>
      <div class="col-12">
        <label class="form-label">Mot de passe</label>
        <input v-model.trim="form.mot_de_passe" type="password" class="form-control" required />
      </div>
      <div class="col-12">
        <label class="form-label">Telephone</label>
        <input v-model.trim="form.telephone" type="text" class="form-control" />
      </div>
      <div class="col-12">
        <label class="form-label">Adresse</label>
        <input v-model.trim="form.adresse" type="text" class="form-control" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Ville</label>
        <input v-model.trim="form.ville" type="text" class="form-control" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Code postal</label>
        <input v-model.trim="form.code_postal" type="text" class="form-control" />
      </div>
      <div class="col-12">
        <button class="btn btn-primary w-100" :disabled="loading">
          {{ loading ? 'Chargement...' : 'Creer le compte' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { setAuth } from '../state/auth'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = ref({
  nom: '',
  prenom: '',
  email: '',
  mot_de_passe: '',
  telephone: '',
  adresse: '',
  ville: '',
  code_postal: ''
})

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/register', form.value)
    setAuth(res.data.user, res.data.token)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de creation'
  } finally {
    loading.value = false
  }
}
</script>
