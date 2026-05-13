import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, get } from 'firebase/database'
import { db, auth } from '../Firebase'

export default function useAuthGuard(requiredRole = 'renter') {
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // Not logged in
    if (!user.email || !user.firebaseUID) {
      navigate('/')
      return
    }

    // Wrong role
    if (user.role !== requiredRole) {
      navigate('/')
      return
    }

    // Check suspension from Firebase
    const userRef = ref(db, `users/${user.firebaseUID}`)
    get(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        if (data.status === 'suspended') {
          localStorage.removeItem('user')
          auth.signOut()
          navigate('/?suspended=true')
        }
      }
    })
  }, [])
}