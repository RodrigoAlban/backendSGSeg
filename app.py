from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db, Vulnerability, Asset

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/vulnerabilities', methods=['GET'])
def get_vulnerabilities():
    vulns = Vulnerability.query.all()
    return jsonify({'vulnerabilities': [v.to_dict() for v in vulns]})

@app.route('/vulnerabilities/<id>', methods=['GET'])
def get_vulnerability(id):
    vuln = Vulnerability.query.get_or_404(id)
    return jsonify(vuln.to_dict())

@app.route('/assets', methods=['GET'])
def get_assets():
    assets = Asset.query.order_by(Asset.priority_score.desc()).all()
    return jsonify({'assets': [{'id': a.id, 'name': a.name, 'version': a.version, 'product': a.product, 'priority_score': a.priority_score, 'vulnerabilities_count': len(a.vulnerabilities)} for a in assets]})

@app.route('/assets/<int:id>', methods=['GET'])
def get_asset(id):
    asset = Asset.query.get_or_404(id)
    vulns = [{'id': v.id, 'title': v.title, 'severity': v.severity} for v in asset.vulnerabilities]
    return jsonify({'asset': {'id': asset.id, 'name': asset.name, 'version': asset.version, 'product': asset.product}, 'vulnerabilities': vulns})

if __name__ == '__main__':
    app.run(debug=True)