#!/usr/bin/env python
import requests
import json

# Тестируем Django API
API_BASE = 'http://localhost:8000/api'

def test_login():
    print("Тестируем логин...")
    response = requests.post(f'{API_BASE}/auth/login/', json={
        'username': 'ukudarovv@gmail.com',
        'password': 'admin123'
    })
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Full response: {json.dumps(data, indent=2)}")
        print(f"Success: {data.get('success')}")
        token = data.get('data', {}).get('accessToken')
        print(f"Token: {token}")
        return token
    else:
        print(f"Error: {response.text}")
        return None

def test_create_location(token):
    if not token:
        print("Нет токена для тестирования создания локации")
        return
        
    print("\nТестируем создание локации...")
    headers = {'Authorization': f'Token {token}'}
    
    # Тестируем с минимальными данными
    location_data = {
        'name': 'Тестовая локация',
        'is_active': True
    }
    
    print(f"Отправляем данные: {json.dumps(location_data, indent=2)}")
    
    response = requests.post(f'{API_BASE}/locations/', json=location_data, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"Локация создана: {data.get('data', {}).get('name')}")
    else:
        print(f"Ошибка создания локации: {response.text}")

def test_get_locations(token):
    if not token:
        print("Нет токена для тестирования получения локаций")
        return
        
    print("\nТестируем получение локаций...")
    headers = {'Authorization': f'Token {token}'}
    response = requests.get(f'{API_BASE}/locations/', headers=headers)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Количество локаций: {len(data.get('results', []))}")
        for location in data.get('results', []):
            print(f"- {location.get('name')} (active: {location.get('is_active')})")
    else:
        print(f"Error: {response.text}")

if __name__ == '__main__':
    token = test_login()
    test_get_locations(token)
    test_create_location(token)
