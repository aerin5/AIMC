// FHIR 서버의 기본 URL과 리소스 타입
const base = 'http://hapi.fhir.org/baseR4'; // FHIR 서버의 기본 URL
const type = 'Patient'; // 요청할 리소스 타입

// FHIR 서버에서 환자 데이터를 가져오는 함수
export async function fetchPatientData(patientId, patientName) {
    let url = `${base}/${type}`;
    
    if (patientId) {
        url += `?_id=${patientId}`;
    } else if (patientName) {
        url += `?name=${patientName}`;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/fhir+json', // 원하는 MIME 타입
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('데이터 가져오기 성공:', data);
            return data;
        } else if (response.status === 410) {
            console.error('리소스가 삭제되었습니다.');
        } else if (response.status === 404) {
            console.error('리소스를 찾을 수 없습니다.');
        } else {
            console.error('요청 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('네트워크 오류가 발생했습니다:', error);
    }
}
