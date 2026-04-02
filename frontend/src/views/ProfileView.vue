<template>
  <div class="container py-4" style="max-width: 720px;">
    <h2 class="mb-3">Mon profil</h2>
    <div v-if="message" class="alert alert-success">{{ message }}</div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <form v-if="loaded" @submit.prevent="submit" class="row g-3">
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
        <button class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : 'Mettre a jour' }}
        </button>
      </div>
    </form>
    <div v-else class="text-muted">Chargement...</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'
import { setAuth } from '../state/auth'

const form = ref({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  adresse: '',
  ville: '',
  code_postal: ''
})
const loaded = ref(false)
const saving = ref(false)
const error = ref('')
const message = ref('')

onMounted(async () => {
  error.value = ''
  try {
    const res = await api.get('/auth/me')
    form.value = {
      nom: res.data.nom || '',
      prenom: res.data.prenom || '',
      email: res.data.email || '',
      telephone: res.data.telephone || '',
      adresse: res.data.adresse || '',
      ville: res.data.ville || '',
      code_postal: res.data.code_postal || ''
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de chargement'
  } finally {
    loaded.value = true
  }
})

const submit = async () => {
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await api.put('/auth/me', form.value)
    setAuth(res.data, localStorage.getItem('token') || '')
    message.value = 'Profil mis a jour'
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de mise a jour'
  } finally {
    saving.value = false
  }
}
</script>
