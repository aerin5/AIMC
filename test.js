

const base = 'http://hapi.fhir.org/baseR4'; // FHIR 서버의 기본 URL
const type = 'Patient'; // 요청할 리소스 타입
const id = '593373'; // 요청할 리소스의 ID

const url = `${base}/${type}/${id}`;

fetch(url, {
    method: 'GET',
    headers: {
        'Accept': 'application/fhir+json', // 원하는 MIME 타입
    }
})
.then(response => {
    if (response.ok) {
        return response.json();
    } else if (response.status === 410) {
        console.error('리소스가 삭제되었습니다.');
    } else if (response.status === 404) {
        console.error('리소스를 찾을 수 없습니다.');
    } else {
        console.error('요청 중 오류가 발생했습니다.');
    }
})
.then(data => {
    console.log(data); // 리소스 데이터를 처리
})
.catch(error => {
    console.error('네트워크 오류가 발생했습니다:', error);
});
