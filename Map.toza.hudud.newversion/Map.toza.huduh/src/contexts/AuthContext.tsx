import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
  login: string
  password: string
  name: string
  phone: string
  driverId: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (login: string, password: string) => boolean
  logout: () => void
  updateCredentials: (newLogin: string, newPassword: string) => void
  updateProfile: (name: string, phone: string) => void
  updateAvatar: (avatar: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('driver_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // Default user with default credentials
      const defaultUser: User = {
        login: 'login',
        password: 'password',
        name: 'Akmaljon Karimov',
        phone: '+998 90 123 45 67',
        driverId: 'DR-2024-001'
      }
      setUser(defaultUser)
      localStorage.setItem('driver_user', JSON.stringify(defaultUser))
    }
  }, [])

  const login = (login: string, password: string): boolean => {
    const savedUser = localStorage.getItem('driver_user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      if (userData.login === login && userData.password === password) {
        setUser(userData)
        setIsAuthenticated(true)
        localStorage.setItem('isAuthenticated', 'true')
        return true
      }
    }
    return false
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
  }

  const updateCredentials = (newLogin: string, newPassword: string) => {
    if (user) {
      const updatedUser = { ...user, login: newLogin, password: newPassword }
      setUser(updatedUser)
      localStorage.setItem('driver_user', JSON.stringify(updatedUser))
    }
  }

  const updateProfile = (name: string, phone: string) => {
    if (user) {
      const updatedUser = { ...user, name, phone }
      setUser(updatedUser)
      localStorage.setItem('driver_user', JSON.stringify(updatedUser))
    }
  }

  const updateAvatar = (avatar: string) => {
    if (user) {
      const updatedUser = { ...user, avatar }
      setUser(updatedUser)
      localStorage.setItem('driver_user', JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateCredentials, updateProfile, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

