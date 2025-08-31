import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortKey, setSortKey] = useState('priority_score')
  const [sortDirection, setSortDirection] = useState('desc')

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:5000/assets')
      setAssets(response.data.assets)
    } catch (err) {
      setError('Failed to fetch data from backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleRefresh = () => {
    fetchAssets()
  }

  // Group by product and calculate average priority_score
  const groupedData = assets.reduce((acc, asset) => {
    if (!acc[asset.product]) {
      acc[asset.product] = { totalScore: 0, count: 0 }
    }
    acc[asset.product].totalScore += asset.priority_score
    acc[asset.product].count += 1
    return acc
  }, {})

  const chartData = Object.keys(groupedData).map(product => ({
    product,
    averagePriority: groupedData[product].totalScore / groupedData[product].count
  }))

  const sortedAssets = [...assets].sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortDirection === 'asc' ? -1 : 1
    if (a[sortKey] > b[sortKey]) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <div className="app">
      <h1>BluePriori Dashboard</h1>
      <button onClick={handleRefresh} disabled={loading}>Refresh Data</button>
      <div className="chart-container">
        <h2>Priority Score by Asset Type</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="product" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averagePriority" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="table-container">
        <h2>Assets List</h2>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>Name {sortKey === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('version')}>Version {sortKey === 'version' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('product')}>Product {sortKey === 'product' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('priority_score')}>Priority Score {sortKey === 'priority_score' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('vulnerabilities_count')}>Vulnerabilities Count {sortKey === 'vulnerabilities_count' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.version}</td>
                <td>{asset.product}</td>
                <td>{asset.priority_score.toFixed(2)}</td>
                <td>{asset.vulnerabilities_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
