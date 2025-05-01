import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from './firebase'

function PrivateRoute({ children, role }) {
  // 1) Track auth loading
  const [user, authLoading] = useAuthState(auth)

  // 2) Track role + its loading state
  //    undefined = not fetched yet
  //    null      = fetched *and* no role in DB
  const [myRole, setMyRole]         = React.useState(undefined)

  React.useEffect(() => {
    if (!user) {
      // not signed in → no role to fetch
      setMyRole(null)
      return
    }
    // signed in → fetch role once
    db.ref(`users/${user.uid}/role`)
      .once('value')
      .then(snap => {
        setMyRole(snap.val())       // could be "user", "admin", or null
      })
      .catch(err => {
        console.error('Failed to fetch role:', err)
        setMyRole(null)
      })
  }, [user])

  // 3) While auth or role is still loading, show spinner
  if (authLoading || myRole === undefined) {
    return <div className="text-center mt-5">Loading…</div>
  }

  // 4) Not signed in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 5) Role mismatch or no role at all → redirect
  if (role && myRole !== role) {
    return <Navigate to="/login" replace />
  }

  // 6) All good → render protected content
  return children
}

export default PrivateRoute
