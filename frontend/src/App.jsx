import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './App.css'

function App() {
  const [assets, setAssets] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortKey, setSortKey] = useState('priority_score')
  const [sortDirection, setSortDirection] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assetDetails, setAssetDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchAssets = async (page = 1) => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/assets?page=${page}&per_page=10`)
      setAssets(response.data.assets)
      setPagination(response.data.pagination)
      setCurrentPage(page)
    } catch (err) {
      setError('Failed to fetch data from backend')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssetDetails = async (assetId, page = 1) => {
    setDetailsLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/assets/${assetId}?page=${page}&per_page=10`)
      setAssetDetails(response.data)
    } catch (err) {
      console.error('Failed to fetch asset details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleRefresh = () => {
    fetchAssets(currentPage)
  }

  const handlePageChange = (page) => {
    fetchAssets(page)
  }

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset)
    fetchAssetDetails(asset.id)
  }

  const handleCloseDetails = () => {
    setSelectedAsset(null)
    setAssetDetails(null)
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

  // Prepare pie chart data for severity distribution
  const severityData = assets.reduce((acc, asset) => {
    const severity = asset.priority_score > 70 ? 'High' : asset.priority_score > 40 ? 'Medium' : 'Low'
    acc[severity] = (acc[severity] || 0) + 1
    return acc
  }, {})

  const pieData = Object.keys(severityData).map(key => ({
    name: key,
    value: severityData[key]
  }))

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1']

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

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="app">
      <header className="header">
        <h1>BluePriori Dashboard</h1>
        <button onClick={handleRefresh} disabled={loading} className="refresh-btn">
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </header>

      <div className="dashboard-grid">
        <div className="chart-section">
          <div className="chart-card">
            <h2>Priority Score by Asset Type</h2>
            <ResponsiveContainer width="100%" height={300}>
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

          <div className="chart-card">
            <h2>Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="table-section">
          <h2>Assets Overview</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name {sortKey === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('version')} className="sortable">
                    Version {sortKey === 'version' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('product')} className="sortable">
                    Product {sortKey === 'product' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('priority_score')} className="sortable">
                    Priority Score {sortKey === 'priority_score' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('vulnerabilities_count')} className="sortable">
                    Vulnerabilities {sortKey === 'vulnerabilities_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAssets.map(asset => (
                  <tr key={asset.id}>
                    <td>{asset.name}</td>
                    <td>{asset.version}</td>
                    <td>{asset.product}</td>
                    <td className={`priority-score ${asset.priority_score > 70 ? 'high' : asset.priority_score > 40 ? 'medium' : 'low'}`}>
                      {asset.priority_score.toFixed(2)}
                    </td>
                    <td>{asset.vulnerabilities_count}</td>
                    <td>
                      <button onClick={() => handleAssetClick(asset)} className="details-btn">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={!pagination.has_prev}
              className="page-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total assets)
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={!pagination.has_next}
              className="page-btn"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedAsset && assetDetails && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAsset.name} - Vulnerabilities</h3>
              <button onClick={handleCloseDetails} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <div className="loading">Loading vulnerabilities...</div>
              ) : (
                <div className="vulnerabilities-list">
                  {assetDetails.vulnerabilities.map(vuln => (
                    <div key={vuln.id} className="vulnerability-item">
                      <div className="vulnerability-header">
                        <span className="vulnerability-id">{vuln.id}</span>
                        <span className={`severity ${vuln.severity?.toLowerCase()}`}>
                          {vuln.severity}
                        </span>
                      </div>
                      <div className="vulnerability-content">
                        <p className="vulnerability-title">{vuln.title}</p>
                        <p className="vulnerability-description">{vuln.description}</p>
                        {vuln.cvssv3_score && (
                          <p className="cvss-score">CVSS Score: {vuln.cvssv3_score}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
