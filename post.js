import fs from 'fs';
import fetch from 'node-fetch';

// JSON 파일 읽기
let patientData;

try {
    patientData = JSON.parse(fs.readFileSync('test_data.json', 'utf8'));
} catch (error) {
    console.error('JSON 파일을 읽거나 파싱하는 중 오류가 발생했습니다:', error);
    process.exit(1); // 종료
}

if (!Array.isArray(patientData)) {
    console.error('JSON 데이터는 배열이어야 합니다.');
    process.exit(1); // 종료
}

const base = 'http://hapi.fhir.org/baseR4'; // FHIR 서버의 기본 URL

// Bundle 리소스로 래핑
const bundle = {
    resourceType: "Bundle",
    type: "transaction",
    entry: []
};

// 각 리소스를 번들에 추가
patientData.forEach(entry => {
    const resource = entry.resource;
    if (resource.resourceType && resource.id) {
        bundle.entry.push({
            fullUrl: `${base}/${resource.resourceType}/${resource.id}`,
            resource: resource,
            request: {
                method: "PUT",  // 기존 ID를 유지하기 위해 POST 대신 PUT 사용
                url: `${resource.resourceType}/${resource.id}`
            }
        });
    } else {
        console.error('올바른 리소스가 아닙니다:', JSON.stringify(entry, null, 2));
    }
});

const url = `${base}`;

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/fhir+json', // MIME 타입
        'Accept': 'application/fhir+json'
    },
    body: JSON.stringify(bundle)
})
.then(response => {
    if (response.status === 200 || response.status === 201) {
        console.log('요청이 성공적으로 처리되었습니다:', response.status, response.statusText);
    } else {
        console.error('요청 중 오류가 발생했습니다:', response.status, response.statusText);
    }
    return response.json();
})
.then(data => {
    // 응답 데이터를 보기 좋게 출력
    console.log(JSON.stringify(data, null, 2));
    // 각 entry의 response를 출력
    if (data.entry) {
        data.entry.forEach((entry, index) => {
            console.log(`Entry ${index + 1} Response:`, entry.response.status);
        });
    }
})
.catch(error => {
    console.error('네트워크 오류가 발생했습니다:', error);
});
