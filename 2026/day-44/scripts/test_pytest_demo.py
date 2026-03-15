"""
pytest demo — Day 44
Shows how pytest generates real test reports (HTML + JUnit XML).

Run locally:
  pip install pytest pytest-html
  pytest day-44/scripts/test_pytest_demo.py -v --html=report.html --junit-xml=report.xml
"""

# ── Functions being tested ────────────────────────────────────────────────────

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


def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b


# ── pytest test functions — pytest auto-discovers any function starting with test_ ──

class TestIsEven:
    def test_even_number(self):
        assert is_even(2) is True

    def test_odd_number(self):
        assert is_even(3) is False

    def test_zero_is_even(self):
        assert is_even(0) is True

    def test_negative_even(self):
        assert is_even(-4) is True


class TestIsPalindrome:
    def test_simple_palindrome(self):
        assert is_palindrome("racecar") is True

    def test_not_palindrome(self):
        assert is_palindrome("hello") is False

    def test_case_insensitive(self):
        assert is_palindrome("RaceCar") is True

    def test_with_spaces(self):
        assert is_palindrome("a man a plan a canal panama") is True


class TestFizzBuzz:
    def test_fizz(self):
        assert fizzbuzz(3) == "Fizz"

    def test_buzz(self):
        assert fizzbuzz(5) == "Buzz"

    def test_fizzbuzz(self):
        assert fizzbuzz(15) == "FizzBuzz"

    def test_plain_number(self):
        assert fizzbuzz(7) == "7"


class TestDivide:
    def test_normal_division(self):
        assert divide(10, 2) == 5.0

    def test_divide_by_zero_raises(self):
        import pytest
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            divide(10, 0)
