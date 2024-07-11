import * as ort from 'onnxruntime-web';

// 모델 로드
const session = await ort.InferenceSession.create('rf_classifier.onnx');

// 입력 데이터 생성
const input = new ort.Tensor('float32', [0, 0], [1, 2]); // 예시 입력 데이터

// 예측 수행
const feeds = { float_input: input };
const results = await session.run(feeds);

// 예측 결과 출력
const output = results.output_label.data;
console.log('Predicted label:', output);