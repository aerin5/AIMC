import os
from flask import Flask, request, jsonify, render_template
import onnxruntime as ort
import numpy as np
import random
from flask_cors import CORS

# 절대 경로를 사용하여 template_folder와 static_folder 설정
template_dir = os.path.abspath("C:/Users/rkddo/Downloads/smart-on-fhir-tutorial-gh-pages/example-smart-app/project-root/templates")
static_dir = os.path.abspath("C:/Users/rkddo/Downloads/smart-on-fhir-tutorial-gh-pages/example-smart-app/project-root/static")

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
CORS(app)

# 모델 로드
model_path = os.path.abspath("C:/Users/rkddo/Downloads/smart-on-fhir-tutorial-gh-pages/example-smart-app/project-root/rf_classifier.onnx")
session = ort.InferenceSession(model_path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    input_data = np.array(data['input'], dtype=np.float32).reshape(1, -1)  # 2D 배열로 변환

    # 예측 실행
    input_name = session.get_inputs()[0].name
    result = session.run(None, {input_name: input_data})
    prediction = result[0]
    
    # 결과 문자열 매핑
    result_mapping = ['Dementia management', 'Musculoskeletal care', 'Cancer care plan',
                      'Fracture care', 'Inpatient care plan (record artifact)',
                      'Lifestyle education regarding hypertension',
                      'Diabetes self management plan']
    
    # 예측 결과에 따른 문자열 반환
    if prediction[0] == 0:
        prediction_str = 'Diabetes self management plan'
    else:
        prediction_str = random.choice(result_mapping[:-1])  # 'Diabetes self management plan'을 제외한 리스트에서 선택

    print(result)  # 결과 배열 추출

    # 결과를 JSON 응답으로 반환
    return jsonify({'prediction': prediction_str})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
