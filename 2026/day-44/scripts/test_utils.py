#!/usr/bin/env python3
"""
Simple test suite — used in Day 44 CI pipeline.
Tests basic utility functions: even/odd check, palindrome check, fizzbuzz.
Exit code 0 = all tests pass, non-zero = failure (pipeline goes red).
"""

import sys


def is_even(n):
    return n % 2 == 0


def is_palindrome(s):
    s = s.lower().replace(" ", "")
    return s == s[::-1]


def fizzbuzz(n):
    if n % 15 == 0:
        return "FizzBuzz"
    elif n % 3 == 0:
        return "Fizz"
    elif n % 5 == 0:
        return "Buzz"
    return str(n)


# ── Tests ────────────────────────────────────────────────────────────────────

passed = 0
failed = 0


def check(description, expected, actual):
    global passed, failed
    if expected == actual:
        print(f"  ✅  PASS  {description}")
        passed += 1
    else:
        print(f"  ❌  FAIL  {description}")
        print(f"            expected: {expected!r}")
        print(f"            got     : {actual!r}")
        failed += 1


print("=== Running test suite ===")
print()

print("[ is_even ]")
check("2 is even",  True,  is_even(2))
check("3 is odd",   False, is_even(3))
check("0 is even",  True,  is_even(0))
check("-4 is even", True,  is_even(-4))
print()

print("[ is_palindrome ]")
check("'racecar' is palindrome",       True,  is_palindrome("racecar"))
check("'hello' is not palindrome",     False, is_palindrome("hello"))
check("'A man a plan a canal Panama'", True,  is_palindrome("A man a plan a canal Panama"))
check("empty string is palindrome",    True,  is_palindrome(""))
print()

print("[ fizzbuzz ]")
check("fizzbuzz(1)  == '1'",        "1",        fizzbuzz(1))
check("fizzbuzz(3)  == 'Fizz'",     "Fizz",     fizzbuzz(3))
check("fizzbuzz(5)  == 'Buzz'",     "Buzz",     fizzbuzz(5))
check("fizzbuzz(15) == 'FizzBuzz'", "FizzBuzz", fizzbuzz(15))
check("fizzbuzz(30) == 'FizzBuzz'", "FizzBuzz", fizzbuzz(30))
print()

print(f"=== Results: {passed} passed, {failed} failed ===")

if failed > 0:
    sys.exit(1)
