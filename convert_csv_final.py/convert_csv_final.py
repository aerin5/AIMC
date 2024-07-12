import json
import pandas as pd
import glob
import os

# 파일 경로
#base_path = 'C:\\Users\\tpgo2\\OneDrive - 성균관대학교\\바탕 화면\\fhir\\output\\fhir\\'
base_path = '/Users/hyunjeong/synthea/output/fhir/'
json_name= '*.json'
file_list = glob.glob(os.path.join(base_path, json_name))

patients = []
conditions = []
observations = []
careplans = []
medication_requests = []
encounters = []

for file_path in file_list:
    with open(file_path, 'r') as file:
        data = json.load(file)
        
        for entry in data['entry']:
            resource = entry['resource']
            if resource['resourceType'] == 'Patient':
                patients.append({
                    'id': resource['id'],
                    'gender': resource['gender'],
                    'birthDate': resource['birthDate'],
                    'address': resource['address'][0]['city']
                })
            elif resource['resourceType'] == 'Condition':
                conditions.append({
                    'id': resource['id'],
                    'patient_id': resource['subject']['reference'].split(':')[-1],
                    'code': resource['code']['text'],
                    'onset': resource['onsetDateTime']
                })
            elif resource['resourceType'] == 'Observation':
                observations.append({
                    'id': resource['id'],
                    'patient_id': resource['subject']['reference'].split(':')[-1],
                    'code': resource['code']['text'],
                    'value': resource['valueQuantity']['value'] if 'valueQuantity' in resource else None,
                    'unit': resource['valueQuantity']['unit'] if 'valueQuantity' in resource else None,
                    'effective': resource.get('effectiveDateTime')
                })
            elif resource['resourceType'] == 'CarePlan':
                careplans.append({
                    'id': resource['id'],
                    'patient_id': resource['subject']['reference'].split(':')[-1],
                    'text': next((coding['display'] for category in resource['category'] for coding in category['coding'] if 'display' in coding), None),
                    'period': resource['period']['start']
                })
            elif resource['resourceType'] == 'MedicationRequest':
                medication_requests.append({
                    'id': resource['id'],
                    'patient_id': resource['subject']['reference'].split(':')[-1],
                    'display': resource['medicationCodeableConcept']['coding'][0]['display'] if 'medicationCodeableConcept' in resource else None,
                    'status': resource['status']
                })
            elif resource['resourceType'] == 'Encounter':
                encounters.append({
                    'id': resource['id'],
                    'patient_id': resource['subject']['reference'].split(':')[-1],
                    'display': resource['type'][0]['coding'][0]['display'],
                    'status': resource['status']
                })

# 데이터프레임으로 변환
patients_df = pd.DataFrame(patients)
conditions_df = pd.DataFrame(conditions)
observations_df = pd.DataFrame(observations)
careplans_df = pd.DataFrame(careplans)
medication_requests_df = pd.DataFrame(medication_requests)
encounters_df = pd.DataFrame(encounters)

# 날짜 형식 변환 시도
conditions_df['onset'] = pd.to_datetime(conditions_df['onset'], errors='coerce', utc=True)
observations_df['effective'] = pd.to_datetime(observations_df['effective'], errors='coerce', utc=True)
careplans_df['period'] = pd.to_datetime(careplans_df['period'], errors='coerce', utc=True)

# 2004년도 이전 데이터 삭제
cutoff_date = pd.Timestamp('2004-01-01', tz='UTC')
conditions_df = conditions_df[conditions_df['onset'] >= cutoff_date]
observations_df = observations_df[observations_df['effective'] >= cutoff_date]
careplans_df = careplans_df[careplans_df['period'] >= cutoff_date]

# CarePlan 텍스트가 null인 행 삭제
careplans_df = careplans_df.dropna(subset=['text'])

# 컬럼명 변경
observations_df.rename(columns={'code': 'observation'}, inplace=True)
conditions_df.rename(columns={'code': 'condition'}, inplace=True)
careplans_df.rename(columns={'text': 'Careplan'}, inplace=True)
medication_requests_df.rename(columns={'status': 'medication_statue'}, inplace=True)
encounters_df.rename(columns={'status': 'encounters_statue'}, inplace=True)

# 필요한 컬럼만 선택
observations_df = observations_df[['effective', 'observation', 'value', 'unit', 'patient_id']]
conditions_df = conditions_df[['onset', 'condition', 'patient_id']]
careplans_df = careplans_df[['period', 'Careplan', 'patient_id']]
medication_requests_df = medication_requests_df[['patient_id', 'display', 'medication_statue']]
encounters_df = encounters_df[['patient_id', 'display', 'encounters_statue']]
patients_df = patients_df[['id','gender', 'birthDate']]

# 데이터 병합 (CarePlan 기준으로 병합)
merged_df = pd.merge(careplans_df, conditions_df, left_on=['patient_id', 'period'], right_on=['patient_id', 'onset'], how='inner')
merged_df = pd.merge(merged_df, observations_df, left_on=['patient_id', 'period'], right_on=['patient_id', 'effective'], how='inner')
merged_df = pd.merge(merged_df, medication_requests_df, on='patient_id', how='inner')
merged_df = pd.merge(merged_df, encounters_df, on='patient_id', how='inner')
merged_df = pd.merge(merged_df, patients_df, left_on='patient_id', right_on='id', how='left')

# 환자 나이 계산
merged_df['period'] = pd.to_datetime(merged_df['period'], errors='coerce')
merged_df['birthDate'] = pd.to_datetime(merged_df['birthDate'], errors='coerce')
merged_df['age'] = merged_df['period'].dt.year - merged_df['birthDate'].dt.year

# null 값 삭제
merged_df = merged_df.dropna(subset=['value'])

# 중복 제거
merged_df = merged_df.drop_duplicates()

# 'id' 열 삭제
merged_df = merged_df.drop(columns=['id','onset','effective'])
merged_df['Careplan'].unique()
# CSV 파일로 저장
csv_file_name = f"{os.path.splitext(json_name)[0]}.csv"
merged_df.to_csv(csv_file_name, index=False)


