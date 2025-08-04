#!/usr/bin/env node

/**
 * Performance Testing Script for ClockPilot
 * Tests various performance optimizations and measures improvements
 */

const http = require('http');
const { performance } = require('perf_hooks');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

console.log('🏃 Starting ClockPilot Performance Tests...\n');

// Test configuration
const tests = [
  {
    name: 'Employee List API',
    path: '/api/employees?limit=20',
    method: 'GET',
    expectedTime: 500, // ms
  },
  {
    name: 'Employee Search API',
    path: '/api/employees?search=john&limit=10',
    method: 'GET',
    expectedTime: 300,
  },
  {
    name: 'Planning API',
    path: '/api/planning?date=2024-08-04',
    method: 'GET',
    expectedTime: 400,
  },
  {
    name: 'Time Entries API',
    path: '/api/time-entries?limit=20',
    method: 'GET',
    expectedTime: 350,
  },
  {
    name: 'Notifications API',
    path: '/api/notifications?limit=10',
    method: 'GET',
    expectedTime: 200,
  },
];

// Performance test function
async function performanceTest(test) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const req = http.request(`${SERVER_URL}${test.path}`, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClockPilot-Performance-Test',
      },
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        resolve({
          name: test.name,
          duration: Math.round(duration),
          status: res.statusCode,
          contentLength: Buffer.byteLength(data),
          passed: duration <= test.expectedTime,
          expected: test.expectedTime,
          headers: res.headers,
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: test.name,
        duration: 0,
        status: 'ERROR',
        error: error.message,
        passed: false,
        expected: test.expectedTime,
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: test.name,
        duration: 5000,
        status: 'TIMEOUT',
        passed: false,
        expected: test.expectedTime,
      });
    });
    
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('📊 Running API Performance Tests...\n');
  
  const results = [];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}...`);
    const result = await performanceTest(test);
    results.push(result);
    
    const status = result.passed ? '✅' : '❌';
    const statusText = result.status === 'ERROR' ? 'ERROR' : 
                      result.status === 'TIMEOUT' ? 'TIMEOUT' : 
                      `${result.status}`;
    
    console.log(`${status} ${result.name}: ${result.duration}ms (expected ≤${result.expected}ms) [${statusText}]`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📈 Performance Test Summary:');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;
  
  console.log(`Tests Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  console.log(`Average Response Time: ${Math.round(avgDuration)}ms`);
  
  // Performance grades
  const grades = {
    excellent: avgDuration <= 200,
    good: avgDuration <= 400,
    fair: avgDuration <= 800,
    poor: avgDuration > 800,
  };
  
  let grade = 'Poor';
  if (grades.excellent) grade = 'Excellent';
  else if (grades.good) grade = 'Good';
  else if (grades.fair) grade = 'Fair';
  
  console.log(`Performance Grade: ${grade}`);
  
  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Content Length: ${result.contentLength || 0} bytes`);
    
    if (result.headers) {
      if (result.headers['x-cache']) {
        console.log(`  Cache: ${result.headers['x-cache']}`);
      }
      if (result.headers['x-response-time']) {
        console.log(`  Server Time: ${result.headers['x-response-time']}`);
      }
    }
  });
  
  // Recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (avgDuration > 500) {
    console.log('   • Consider implementing Redis caching');
    console.log('   • Optimize database queries with indexes');
    console.log('   • Implement response compression');
  }
  
  if (passed < total) {
    console.log('   • Some endpoints are slower than expected');
    console.log('   • Check database query optimization');
    console.log('   • Monitor server resource usage');
  }
  
  const slowTests = results.filter(r => r.duration > r.expected);
  if (slowTests.length > 0) {
    console.log('   • Slow endpoints detected:');
    slowTests.forEach(test => {
      console.log(`     - ${test.name}: ${test.duration}ms (expected ≤${test.expected}ms)`);
    });
  }
  
  console.log('\n✨ Performance testing completed!');
  
  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Handle server not running
process.on('unhandledRejection', (error) => {
  console.error('❌ Server might not be running or accessible');
  console.error('   Make sure the server is running on', SERVER_URL);
  console.error('   Error:', error.message);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Performance test failed:', error.message);
  process.exit(1);
});