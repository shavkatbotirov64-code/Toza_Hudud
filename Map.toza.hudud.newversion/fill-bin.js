// Fill bin - set fillLevel to 95% (simulate ESP32 signal)
const binId = '0228dc40-dc35-4a72-a554-4b789e3235e2'
const backendUrl = 'https://tozahudud-production-d73f.up.railway.app'

async function fillBin() {
  try {
    console.log('📦 Filling bin to 95%...')
    
    const response = await fetch(`${backendUrl}/bins/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fillLevel: 95,
        status: 'FULL'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Bin filled successfully!')
      console.log('📦 Updated bin:', data)
      console.log('🔴 Bin should now be RED in the map')
      console.log('🚛 Closest vehicle should be dispatched automatically')
    } else {
      console.error('❌ Failed to fill bin:', response.status, response.statusText)
      const text = await response.text()
      console.error('Response:', text)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fillBin()
