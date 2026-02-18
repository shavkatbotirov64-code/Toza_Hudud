// Clean bin - set fillLevel to 15%
const binId = '0228dc40-dc35-4a72-a554-4b789e3235e2'
const backendUrl = 'https://tozahudud-production-d73f.up.railway.app'

async function cleanBin() {
  try {
    console.log('🧹 Cleaning bin...')
    
    const response = await fetch(`${backendUrl}/bins/${binId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fillLevel: 15
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Bin cleaned successfully!')
      console.log('📦 Updated bin:', data)
    } else {
      console.error('❌ Failed to clean bin:', response.status, response.statusText)
      const text = await response.text()
      console.error('Response:', text)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

cleanBin()
