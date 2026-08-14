#include <stdio.h>
#include <stdlib.h>

int main()
{
    int i, j, n, temp;
    int p[10], pr[10], bt[10], wt[10], tat[10];
    float avgtat, avgwt;

    printf("Enter number of processes: ");
    scanf("%d", &n);

    for (i = 0; i < n; i++)
    {
        printf("Enter process number: ");
        scanf("%d", &p[i]);

        printf("Enter burst time: ");
        scanf("%d", &bt[i]);

        printf("Enter priority: ");
        scanf("%d", &pr[i]);
    }

    // Sort by priority (higher number = higher priority)
    for (i = 0; i < n; i++)
    {
        for (j = i + 1; j < n; j++)
        {
            if (pr[i] < pr[j])
            {
                temp = p[i];
                p[i] = p[j];
                p[j] = temp;

                temp = bt[i];
                bt[i] = bt[j];
                bt[j] = temp;

                temp = pr[i];
                pr[i] = pr[j];
                pr[j] = temp;
            }
        }
    }

    wt[0] = 0;
    tat[0] = bt[0];
    avgwt = 0;
    avgtat = tat[0];

    for (i = 1; i < n; i++)
    {
        wt[i] = wt[i - 1] + bt[i - 1];
        tat[i] = wt[i] + bt[i];

        avgwt += wt[i];
        avgtat += tat[i];
    }

    printf("\nP_no\tPriority\tB_time\tW_time\tTAT\n");
    for (i = 0; i < n; i++)
        printf("%d\t%d\t\t%d\t%d\t%d\n", p[i], pr[i], bt[i], wt[i], tat[i]);

    printf("\nAverage waiting time = %.2f\n", avgwt / n);
    printf("Average turnaround time = %.2f\n", avgtat / n);

    return 0;
}
higher