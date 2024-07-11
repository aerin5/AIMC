import fs from 'fs';
import fetch from 'node-fetch';

const base = 'http://hapi.fhir.org/baseR4'; // FHIR 서버의 기본 URL

// Location 리소스를 생성
const createLocation = async () => {
    const locationData = {
        resourceType: "Location",
        identifier: [{
            system: "https://github.com/synthetichealth/synthea",
            value: "956c981c-5bbc-3bac-b136-d53e114cc33f"
        }],
        status: "active",
        name: "Example Location"
    };

    const response = await fetch(`${base}/Location`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/fhir+json',
            'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(locationData)
    });
    const data = await response.json();
    if (response.ok) {
        console.log('Location created:', data);
        return data.id;
    } else {
        throw new Error(`Failed to create Location: ${data}`);
    }
};

// Practitioner 리소스를 생성
const createPractitioner = async (identifier) => {
    const practitionerData = {
        resourceType: "Practitioner",
        identifier: [{
            system: "http://hl7.org/fhir/sid/us-npi",
            value: identifier
        }],
        active: true,
        name: [{
            use: "official",
            family: "Doe",
            given: ["John"]
        }]
    };

    const response = await fetch(`${base}/Practitioner`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/fhir+json',
            'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(practitionerData)
    });
    const data = await response.json();
    if (response.ok) {
        console.log('Practitioner created:', data);
        return data.id;
    } else {
        throw new Error(`Failed to create Practitioner: ${data}`);
    }
};

const uploadBundle = async () => {
    try {
        const locationId = await createLocation();

        // 이제 Bundle 내 참조를 수정
        const bundleData = JSON.parse(fs.readFileSync('test_data.json', 'utf8'));

        const practitionerIdentifiers = new Set();
        bundleData.entry.forEach(entry => {
            if (entry.resource.resourceType === 'Location') {
                entry.resource.id = locationId;
            }
            if (entry.resource.resourceType === 'Patient' && entry.resource.managingOrganization) {
                entry.resource.managingOrganization.reference = `Location/${locationId}`;
            }
            if (entry.resource.resourceType === 'Patient' && entry.resource.generalPractitioner) {
                entry.resource.generalPractitioner.forEach(gp => {
                    if (gp.reference.startsWith('Practitioner?identifier=')) {
                        const identifier = gp.reference.split('=')[1];
                        practitionerIdentifiers.add(identifier);
                    }
                });
            }
        });

        const practitionerIdMap = {};
        for (let identifier of practitionerIdentifiers) {
            const practitionerId = await createPractitioner(identifier.split('|')[1]);
            practitionerIdMap[identifier] = practitionerId;
        }

        bundleData.entry.forEach(entry => {
            if (entry.resource.resourceType === 'Patient' && entry.resource.generalPractitioner) {
                entry.resource.generalPractitioner.forEach(gp => {
                    if (gp.reference.startsWith('Practitioner?identifier=')) {
                        const identifier = gp.reference.split('=')[1];
                        gp.reference = `Practitioner/${practitionerIdMap[identifier]}`;
                    }
                });
            }
        });

        // Bundle 업로드
        const response = await fetch(`${base}/Bundle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/fhir+json',
                'Accept': 'application/fhir+json'
            },
            body: JSON.stringify(bundleData)
        });

        const responseData = await response.json();
        if (response.status === 200 || response.status === 201) {
            console.log('Bundle이 성공적으로 업로드되었습니다.');
        } else if (response.status === 400) {
            console.error('잘못된 요청입니다. 리소스를 생성할 수 없습니다.');
        } else if (response.status === 422) {
            console.error('비즈니스 규칙에 의해 리소스가 거부되었습니다.');
        } else {
            console.error('요청 중 오류가 발생했습니다:', response.status, response.statusText);
        }
        console.log(responseData); // 응답 데이터를 처리
    } catch (error) {
        console.error('네트워크 오류가 발생했습니다:', error);
    }
};

uploadBundle();
