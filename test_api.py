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
        print(f"Token: {data.get('data', {}).get('accessToken', 'N/A')[:20]}...")
        return data.get('data', {}).get('accessToken')
    else:
        print(f"Error: {response.text}")
        return None

def test_locations(token):
    if not token:
        print("Нет токена для тестирования локаций")
        return
        
    print("\nТестируем получение локаций...")
    headers = {'Authorization': f'Token {token}'}
    response = requests.get(f'{API_BASE}/locations/', headers=headers)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Количество локаций: {len(data.get('results', []))}")
        for location in data.get('results', []):
            print(f"- {location.get('name')}")
    else:
        print(f"Error: {response.text}")

if __name__ == '__main__':
    token = test_login()
    test_locations(token)
