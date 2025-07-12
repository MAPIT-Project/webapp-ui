#!/bin/bash

# Test script for rate limiting functionality
# Make sure the server is running before executing this script

API_BASE="http://localhost:5173"
COLORS_ENABLED=true

# Colors for output
if [ "$COLORS_ENABLED" = true ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

echo -e "${BLUE}🔒 Testing Rate Limiting Functionality${NC}"
echo "=============================================="

# Test 1: Authentication Rate Limiting
echo -e "\n${YELLOW}📋 Test 1: Authentication Rate Limiting (5 attempts per 15 minutes)${NC}"
echo "Sending 6 login attempts to trigger rate limit..."

for i in {1..6}; do
    echo -n "Attempt $i: "
    
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrongpassword"}' \
        -o /dev/null)
    
    if [ "$response" = "429" ]; then
        echo -e "${RED}Rate Limited ✓${NC}"
        break
    elif [ "$response" = "401" ]; then
        echo -e "${GREEN}Allowed (401 - Invalid credentials)${NC}"
    else
        echo -e "${YELLOW}Unexpected response: $response${NC}"
    fi
    
    sleep 1
done

# Test 2: AI Query Rate Limiting
echo -e "\n${YELLOW}📋 Test 2: AI Query Rate Limiting (10 requests per minute)${NC}"
echo "Sending 12 queries to trigger rate limit..."

for i in {1..12}; do
    echo -n "Query $i: "
    
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE/api/query" \
        -H "Content-Type: application/json" \
        -d '{"question":"test query"}' \
        -o /dev/null)
    
    if [ "$response" = "429" ]; then
        echo -e "${RED}Rate Limited ✓${NC}"
        break
    elif [ "$response" = "503" ]; then
        echo -e "${YELLOW}Service Unavailable (CORDIS API not running)${NC}"
    else
        echo -e "${GREEN}Allowed ($response)${NC}"
    fi
    
    sleep 0.5
done

# Test 3: General API Rate Limiting
echo -e "\n${YELLOW}📋 Test 3: General API Rate Limiting (100 requests per minute)${NC}"
echo "Sending rapid requests to test general API rate limiting..."

rate_limited=false
for i in {1..105}; do
    if [ $((i % 10)) -eq 0 ]; then
        echo -n "Request $i: "
    fi
    
    response=$(curl -s -w "%{http_code}" -X GET "$API_BASE/api/test" \
        -o /dev/null)
    
    if [ "$response" = "429" ]; then
        echo -e "${RED}Rate Limited at request $i ✓${NC}"
        rate_limited=true
        break
    elif [ $((i % 10)) -eq 0 ]; then
        echo -e "${GREEN}Allowed${NC}"
    fi
done

if [ "$rate_limited" = false ]; then
    echo -e "${YELLOW}No rate limit reached (may need to adjust test or check implementation)${NC}"
fi

# Test 4: Rate Limit Headers
echo -e "\n${YELLOW}📋 Test 4: Rate Limit Headers${NC}"
echo "Checking for rate limit headers in response..."

curl -s -I "$API_BASE/api/auth/login" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' | grep -i "x-ratelimit"

# Test 5: Rate Limit Reset
echo -e "\n${YELLOW}📋 Test 5: Rate Limit Reset (wait 1 minute)${NC}"
echo "This test requires waiting for rate limit to reset..."
echo "You can run this manually after waiting for the appropriate time window."

echo -e "\n${BLUE}🏁 Rate Limiting Tests Complete${NC}"
echo "=============================================="
echo -e "${GREEN}✅ If you see rate limits being triggered, the implementation is working!${NC}"
echo -e "${YELLOW}💡 Note: Some tests may fail if external services (like CORDIS API) are not running.${NC}"
echo -e "${BLUE}📖 Check the rate limit headers in the response to see current limits and remaining requests.${NC}" 