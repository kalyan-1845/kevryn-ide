# 📝 Kevryn IDE: Sample Demo Content

Use these samples to populate your **Assignments** and **Aptitude Tests** during the demo.

---

## 💻 1. Sample Coding Assignment
**Purpose**: To demonstrate real-time code execution and monitoring.

*   **Title**: Factorial & Logic Check
*   **Subject**: Data Structures / Python Basics
*   **Description**: 
    > Write a program that takes an integer `n` as input and calculates its factorial. 
    > **Constraint**: Use a loop or recursion. If the input is negative, print 'Invalid Input'.
*   **Sample Input**: `5`
*   **Expected Output**: `120`
*   **Execution Test (C)**:
    ```c
    #include <stdio.h>
    int main() {
        int n, i;
        unsigned long long fact = 1;
        printf("Enter an integer: ");
        scanf("%d", &n);
        if (n < 0) printf("Invalid Input");
        else {
            for (i = 1; i <= n; ++i) fact *= i;
            printf("Factorial of %d = %llu", n, fact);
        }
        return 0;
    }
    ```

---

## 🧠 2. Sample Aptitude Test (MCQs)
**Purpose**: To show the multiple-choice platform and auto-grading.

*   **Subject**: General Aptitude / Placement Training
*   **Duration**: 5 Minutes

### Question 1: Quantitative
*   **Question**: If 5 workers can build a wall in 10 days, how many days will it take for 2 workers to build the same wall?
*   **Option A**: 4 days
*   **Option B**: 20 days
*   **Option C**: 25 days
*   **Option D**: 15 days
*   **Answer**: **C (25 days)**  *(Logic: 5 x 10 = 50 man-days. 50 / 2 = 25)*

### Question 2: Logical Reasoning
*   **Question**: Find the missing number in the series: 2, 4, 8, 16, 32, __?
*   **Option A**: 48
*   **Option B**: 64
*   **Option C**: 40
*   **Option D**: 56
*   **Answer**: **B (64)** *(Logic: Geometric progression with ratio 2)*

### Question 3: Java/Coding Basics
*   **Question**: Which of these is NOT a primitive data type in Java?
*   **Option A**: int
*   **Option B**: boolean
*   **Option C**: String
*   **Option D**: char
*   **Answer**: **C (String)** *(Logic: String is a Class, not a primitive)*

---

## 🎯 Pro Tip for the Demo
1.  **Faculty Side**: Create the assignment/test **live** in front of the Chairman to show how easy it is.
2.  **Student Side**: Have a student (e.g., Kalyan) log in and solve the MCQ test to show the **Instant Submission** and **Live Gradebook** update.
