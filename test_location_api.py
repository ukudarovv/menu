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
        print(f"Success: {data.get('success')}")
        return data.get('data', {}).get('token')
    else:
        print(f"Error: {response.text}")
        return None

def test_create_location(token):
    if not token:
        print("Нет токена для тестирования создания локации")
        return
        
    print("\nТестируем создание локации...")
    headers = {'Authorization': f'Token {token}'}
    
    location_data = {
        'name': 'Тестовая локация',
        'description': 'Описание тестовой локации',
        'address': 'Тестовый адрес',
        'phone': '+7 (999) 123-45-67',
        'email': 'test@example.com',
        'capacity': 50,
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

if __name__ == '__main__':
    token = test_login()
    test_create_location(token)
