from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/js')
def return_js():
    return send_from_directory('js','bf.js')

@app.route('/css')
def return_css():
    return send_from_directory('css','style.css')

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, port=3001)
