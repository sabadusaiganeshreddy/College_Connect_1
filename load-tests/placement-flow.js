import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    placement_peak: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<750'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:4000';
const collegeDomain = __ENV.COLLEGE_DOMAIN || 'loadtest.edu';

export function setup() {
  const payload = JSON.stringify({
    name: 'Load Test Seed',
    email: `seed@${collegeDomain}`,
    linkedin: 'https://linkedin.com/in/load-test-seed',
    collegeName: 'Load Test University',
  });

  http.post(`${baseUrl}/api/auth/register`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export default function placementFlow() {
  const userId = `${__VU}-${__ITER}-${Date.now()}`;
  const registerPayload = JSON.stringify({
    name: `Student ${userId}`,
    email: `student-${userId}@${collegeDomain}`,
    linkedin: `https://linkedin.com/in/student-${userId}`,
  });

  const register = http.post(`${baseUrl}/api/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(register, {
    'register ok': (response) => response.status === 200 || response.status === 201,
  });

  const token = register.json('token');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const snapshot = http.get(`${baseUrl}/api/placement/snapshot`);
  check(snapshot, {
    'snapshot ok': (response) => response.status === 200,
  });

  if (__ITER % 5 === 0) {
    const companyPayload = JSON.stringify({
      name: `Company ${__VU}-${__ITER}`,
      visitDate: '2026-08-01',
      jobRoles: ['SDE-1', 'Intern'],
      selectedForCurrentUser: true,
      totalSelections: 1,
    });

    const company = http.post(`${baseUrl}/api/companies`, companyPayload, {
      headers: authHeaders,
    });

    check(company, {
      'company ok': (response) => response.status === 201 || response.status === 409,
    });
  }

  sleep(1);
}

