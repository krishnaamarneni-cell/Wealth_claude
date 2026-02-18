const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY

export const searchStocks = async (query: string) => {
  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&apikey=${FMP_API_KEY}`
  )
  return response.json()
}
