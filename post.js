import fs from 'fs';
import fetch from 'node-fetch';

// JSON 파일 읽기
const patientData = JSON.parse(fs.readFileSync('data_test.json', 'utf8'));

const base = 'http://hapi.fhir.org/baseR4'; // FHIR 서버의 기본 URL
const type = 'Patient'; // 리소스 타입

const url = `${base}/${type}?_format=json`;

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/fhir+json', // MIME 타입
        'Accept': 'application/fhir+json'
    },
    body: JSON.stringify(patientData)
})
.then(response => {
    if (response.status === 201) {
        console.log('리소스가 성공적으로 생성되었습니다.');
        console.log('Location:', response.headers.get('Location'));
    } else if (response.status === 400) {
        console.error('잘못된 요청입니다. 리소스를 생성할 수 없습니다.');
    } else if (response.status === 422) {
        console.error('비즈니스 규칙에 의해 리소스가 거부되었습니다.');
    } else {
        console.error('요청 중 오류가 발생했습니다:', response.status, response.statusText);
    }
    return response.json();
})
.then(data => {
    console.log(data); // 응답 데이터를 처리
})
.catch(error => {
    console.error('네트워크 오류가 발생했습니다:', error);
});
