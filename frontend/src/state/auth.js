import { reactive } from 'vue'

const state = reactive({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || ''
})

export const useAuthState = () => state

export const setAuth = (user, token) => {
  state.user = user
  state.token = token || ''
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', state.token)
}

export const clearAuth = () => {
  state.user = null
  state.token = ''
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}

export const getToken = () => state.token
