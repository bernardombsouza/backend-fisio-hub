import pandas as pd
import requests

# physio_list = pd.read_excel('C:/Users/berna/Downloads/Lista de fisioterapeutas.xlsx')

# for index, row in physio_list.iterrows():
#     data = {
#         "fullName": row['fullName'],
#         "email": row['email'],
#         "password": row['password'],  # Lembre-se de hashear no backend antes de salvar
#         "confirmPassword": row['password'],  # Para validação, pode ser o mesmo valor 
#         "role": "PHYSIO",
#         "avatarUrl": row.get('avatarUrl'),
#         "speciality": row['speciality'], # Se vier como string separada por vírgula, use row
#         "crefito": row['crefito'],
#         "location": row['location'],
#         "city": row['city'],
#         "state": row['state'],
#         "consultPrice": float(row['consultPrice']),
#         "slotDuration": int(row['slotDuration']),
#         "bio": row['bio'],
#         "clinicName": row.get('clinicName'),
#         "tags": row['tags'] # Se vier como string separada por vírgula, use row['tags'].split(',')
#     }
    
#     response = requests.post('http://localhost:5000/api/auth/register', json=data)
    
#     if response.status_code == 201:
#         print(f"Fisioterapeuta {row['fullName']} criado com sucesso.")
#     else:
#         print(f"Erro ao criar fisioterapeuta {row['fullName']}: {response.text}")


response = requests.post('http://localhost:5000/api/auth/login', json={
    "email": "bernardohamtaro@gmail.com",
    "password": "teste123!"
})

print(response.json()['data']['accessToken'])

criando_slots = requests.post('http://localhost:5000/api/available-slots', headers={
    "Authorization": f"Bearer {response.json()['data']['accessToken']}"
}, json={
    "userId": 'cmq1bdyze0014vwu05rqcrkou',
    "date": "2024-06-20",
    "startTime": "08:00",
    "endTime": "09:00"
})

print(criando_slots.json())