# Round Robin CPU Scheduling Visualizer

An interactive, browser-based visualizer for understanding the **Round Robin CPU scheduling algorithm**. It was created for Operating Systems practical activities and demonstrates scheduling both with and without context-switching overhead.

## Features

- **Two scheduling activities:** Run simulations with zero context-switching overhead or with configurable overhead.
- **Editable process inputs:** Change each process's arrival time and burst time.
- **Adjustable time quantum:** Set the time quantum before running a simulation.
- **Gantt chart:** Visualize process execution, CPU idle periods, and context-switch intervals.
- **Process metrics:** View completion time, turnaround time, waiting time, and response time for each process.
- **Performance summary:** View average turnaround, waiting, and response times, context-switch count, and total context-switch overhead.
- **Time quantum comparison:** Compare two configured time quantums with side-by-side Gantt charts and a metrics table.
- **Input validation:** Shows an error when process or scheduling values are invalid.

## Activities

### Activity 1 — Without Context Switching Overhead

- Context-switch overhead is fixed at 0 ms.
- Default time quantum: 2 ms.
- Default comparison: 2 ms vs. 3 ms.
- Default processes:

| Process | Arrival Time | Burst Time |
| --- | ---: | ---: |
| P1 | 0 ms | 5 ms |
| P2 | 1 ms | 3 ms |
| P3 | 2 ms | 4 ms |
| P4 | 3 ms | 2 ms |

### Activity 2 — With Context Switching Overhead

- Context-switch overhead is configurable.
- Default overhead: 1 ms.
- Default time quantum: 2 ms.
- Default comparison: 2 ms vs. 4 ms.

## Scheduling Metrics

| Metric | Meaning |
| --- | --- |
| Completion Time (CT) | Time at which a process finishes execution |
| Turnaround Time (TAT) | Completion Time − Arrival Time |
| Waiting Time (WT) | Turnaround Time − Burst Time |
| Response Time (RT) | First CPU start time − Arrival Time |
| Context Switches | Number of switches between different processes |

## Run the Project

This is a static frontend project built with HTML, CSS, and vanilla JavaScript. No package installation or build step is required.

1. Clone the repository:

   ```bash
   git clone https://github.com/karthikmudappilakkil/OSvisualizer.git
   ```

2. Open the project folder.
3. Open `index.html` in a web browser.

## Project Structure

```text
OSvisualizer/
├── index.html   # Page structure and interface
├── style.css    # Layout and styling
└── script.js    # Round Robin algorithm and UI logic
```

## Built With

- HTML5
- CSS3
- JavaScript (Vanilla)

## Author

**Karthik M P**

- GitHub: [@karthikmudappilakkil](https://github.com/karthikmudappilakkil)
