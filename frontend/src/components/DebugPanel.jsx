import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import ApiService from '../services/api'

const DebugPanel = () => {
  const { binsData, vehiclesData, alertsData } = useAppContext()
  const [apiTest, setApiTest] = useState(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await ApiService.getBins()
      setApiTest(response)
      console.log('API Test Result:', response)
    } catch (error) {
      setApiTest({ error: error.message })
      console.error('API Test Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      maxWidth: '300px',
      fontSize: '12px',
      zIndex: 10000
    }}>
      <h4>Debug Panel</h4>
      <div>
        <strong>Bins Data:</strong> {binsData.length} items
        <br />
        <strong>Vehicles Data:</strong> {vehiclesData.length} items
        <br />
        <strong>Alerts Data:</strong> {alertsData.length} items
      </div>
      
      <button 
        onClick={testAPI} 
        disabled={loading}
        style={{ marginTop: '10px', padding: '5px 10px' }}
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>
      
      {apiTest && (
        <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
          <strong>API Result:</strong>
          <pre>{JSON.stringify(apiTest, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default DebugPanel