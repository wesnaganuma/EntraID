export async function fetchProfile(accessToken: string) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph API error: ${res.status} ${text}`)
  }

  return res.json()
}

export default fetchProfile
