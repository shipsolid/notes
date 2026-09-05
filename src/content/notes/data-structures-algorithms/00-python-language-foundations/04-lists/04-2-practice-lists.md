---
title: "Practice: Lists"
description: "The raw practice source behind the Lists chapter — creating, accessing, growing, shrinking, iterating, counting, sorting, slicing, copying, and unpacking a Python list, as the original runnable functions grouped by operation."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031827"
---

# Practice: Lists

This is the raw practice source behind [[04-1-lists|4 — Lists]] — every list-operation drill written
while building the intuition that chapter distills into worked examples and complexity tables. Where
the chapter picks a handful of representative problems, this note keeps the full set of small
functions it was drawn from, grouped by operation rather than the order they were originally written
in. None of them have been rewritten or bug-fixed here; this is a structural pass (frontmatter,
headings, grouping) only, not a correctness review.

---

## Creating Lists

```python
def print_creating_lists():
  # Empty lists
  empty_list = []

  # Homogeneous List
  # List of temperatures recorded every hour (all floats)
  hourly_temperatures = [21.5, 22.0, 22.3, 21.8, 21.0]
  print("Temperatures:", hourly_temperatures)
  print("List length:", len(hourly_temperatures))

  # Heterogeneous List
  # Data about a file: name (str), size in MB (float), is_downloaded (bool)
  file_info = ["report.pdf", 2.4, True]
  print("File info:", file_info)
  print("List length:", len(file_info))
```

---

## Accessing List Elements

```python
def print_accessing_elements():
  # --- accessing_elements.py ---
  # List of recent app notifications
  notifications = ["Update available", "New message", "Battery low", "Backup completed"]

  # Access the first and third notification
  print("First notification:", notifications[0])
  print("Third notification:", notifications[2])

  # --- accessing_negative_index.py ---
  # List of recent search queries
  search_history = ["python lists", "sort algorithm", "weather tomorrow", "coffee shops nearby"]

  # Access the last and second-to-last search
  print("Last search:", search_history[-1])
  print("Second last search:", search_history[-2])

  # --- index_error.py ---
  # List of scheduled meetings
  meetings = ["Team Sync", "Client Call", "Project Review"]

  try:
    # Attempt to access a meeting that doesn't exist
    print("Meeting 5:", meetings[3])
  except IndexError:
    print("That meeting does not exist in the list.")

  # --- notification_example.py ---
  # Recent app notifications
  notification1 = "Update available"
  notification2 = "New message"
  notification3 = "Battery low"
  notification4 = "Backup completed"
```

---

## Adding New Elements to the List

```python
def print_adding_elements():
  # --- appending.py ---
  # Log of system events
  event_log = ["System start", "User login"]

  # Appending a new element to the list
  event_log.append("File uploaded")

  print("Event log:", event_log)

  # --- concatenating.py ---
  # Morning and afternoon checklists
  morning_tasks = ["Make bed", "Exercise", "Breakfast"]
  afternoon_tasks = ["Meeting", "Code review", "Emails"]

  # Concatenation - combining two lists into one
  full_day = morning_tasks + afternoon_tasks

  print("Full day schedule:", full_day)

  # --- extending.py ---
  # Current queue of print jobs
  print_queue = ["Invoice.pdf", "Poster.png"]

  # New batch of jobs arrives
  new_jobs = ["Contract.docx", "Blueprint.dwg"]

  # Use the extend method to add multiple items to an existing list
  print_queue.extend(new_jobs)

  print("Updated print queue:", print_queue)

  # --- inserting.py ---
  # List of tasks ordered by priority
  tasks = ["Fix critical bug", "Send email", "Clean workspace"]

  # Insert an element at a specific position
  tasks.insert(1, "Write report")

  print("Task list:", tasks)
```

---

## Removing and Updating List Elements

```python
def print_removing_and_updating():
  # --- clearing.py ---
  # Temporary cache of downloaded files
  download_cache = ["img1.png", "doc2.pdf", "slides.pptx"]

  # Clear all elements
  download_cache.clear()

  print("Download cache after clearing:", download_cache)

  # --- pop_with_arguments.py ---
  # Active timers in seconds
  timers = [300, 600, 120, 45]

  # Remove specific element by index
  # Cancel the second timer (index 1)
  cancelled = timers.pop(1)

  print("Remaining timers:", timers)
  print("Cancelled timer:", cancelled)

  # --- pop_without_arguments.py ---
  # Recently completed tasks (stack-style)
  completed_tasks = ["Write draft", "Submit form", "Fix bug"]

  # Remove and retrieve the last element
  last_task = completed_tasks.pop()

  print("Remaining tasks:", completed_tasks)
  print("Last completed task:", last_task)

  # --- removing.py ---
  # Items in a virtual shopping list
  shopping_list = ["rice", "pasta", "tofu", "pasta"]

  # Remove an element by value (first match)
  shopping_list.remove("pasta")

  print("Updated shopping list:", shopping_list)

  # --- updating.py ---
  # A simple playlist
  playlist = ["Song A", "Song B", "Song C"]

  # Update an element by index
  playlist[1] = "Song X"

  print("Updated playlist:", playlist)
```

---

## Iterating over List Elements

```python
def print_iterating():
  # --- for_loop.py ---
  # A list of instruments
  instruments = ["guitar", "piano", "drums"]

  for instrument in instruments:
    print("I can play the", instrument)

  # --- enumerating.py ---
  # List of items in a delivery package
  package_contents = ["Keyboard", "Mouse", "Monitor"]

  # Label each item with its position
  for i, item in enumerate(package_contents, 1):
    print(f"Item {i}: {item}")

  # --- nested_list.py ---
  # Nested lists
  matrix = [[1, 2, 3], [4, 5, 6]]

  # Print each row of the matrix
  for row in matrix:
    print("Row:", row)

  # Print every element in the matrix, row by row
  for row in matrix:
    for value in row:
      print("Value:", value)
```

---

## Counting List Elements

```python
def print_counting():
  # --- counting.py ---
  # Logged system statuses
  statuses = ["online", "offline", "online", "error", "online"]

  # Count how many times "online" appears
  online_count = statuses.count("online")

  print("Systems online:", online_count)

  # --- indexing.py ---
  task_queue = ["backup", "scan", "update", "scan"]

  # Get the position of the first "scan" task
  first_scan = task_queue.index("scan")

  print("First 'scan' task is at position:", first_scan)

  # --- check_if_in.py ---
  # List of enabled features
  features = ["dark_mode", "notifications", "autosave"]

  # Only get index if the feature exists
  if "autosave" in features:
    position = features.index("autosave")
    print("Autosave found at position:", position)
  else:
    print("Autosave not enabled.")

  # --- check_if_not_in.py ---
  # Available resources
  resources = ["GPU", "CPU", "RAM"]

  if "SSD" not in resources:
    print("SSD not available for allocation.")
```

---

## Sorting List Elements

```python
def print_sorting():
  # --- using_sort.py ---
  files = ["log.txt", "config.txt", "error.txt"]
  temps = [18.5, 21.0, 19.8, 23.1]

  # Sort alphabetically, modifies original list
  files.sort()
  # Sort in ascending order
  temps.sort()
  print("Alphabetical file order:", files)
  print("Temperatures from lowest to highest:", temps)

  files.sort(reverse=True)
  temps.sort(reverse=True)
  print("Alphabetical file order in reverse:", files)
  print("Temperatures from highest to lowest:", temps)

  # --- using_sorted_function.py ---
  # Preserve original order of priorities
  priorities = [3, 1, 2]

  # Create a new sorted version
  sorted_priorities = sorted(priorities)
  # Or in descending order
  # sorted_priorities = sorted(priorities, reverse=True)

  print("Original priorities:", priorities)
  print("Sorted copy:", sorted_priorities)

  # --- reversing.py ---
  # Log of events, most recent last
  events = ["Start", "Load", "Process", "Finish"]

  # Reverse the list to show most recent first
  events.reverse()

  print("Events in reverse order:", events)
```

---

## Slicing and Cloning Lists

```python
def print_slicing_and_cloning():
  # --- list_slicing.py ---
  letters = ["a", "b", "c", "d", "e", "f", "g"]

  print("letters:\t", letters)
  # list[start:end] (start element is included)
  print("letters[2:5]:\t", letters[2:5])

  # You can use negative indices
  print("letters[-4:-1]:\t", letters[-4:-1])

  # list[:end] (from beginning of the list to the index)
  print("letters[:3]:\t", letters[:3])
  # list[start:] (from the start index to the end of the list)
  print("letters[4:]:\t", letters[4:])

  # --- list_slicing_with_step.py ---
  letters = ["a", "b", "c", "d", "e", "f", "g"]

  # list[::step] (get every other element)
  print("letters[1:6:2]:\t", letters[1:6:2])

  # Reverse the list
  print("letters[::-3]:\t", letters[::-3])

  # --- aliasing.py ---
  # List of enabled modules
  modules = ["core", "auth", "storage"]

  # This creates an alias, not a copy
  linked = modules

  linked.append("analytics")

  print("Original list:", modules)
  print("Alias list:", linked)

  # --- shallow_copy.py ---
  # List of enabled modules
  modules = ["core", "auth", "storage"]

  # Create a shallow copy using slicing
  copied = modules[:]
  # Or you can use the list constructor
  # copied = list(modules)

  copied.remove("auth")

  print("Original:", modules)
  print("Shallow copy:", copied)

  # --- shallow_copy_nested.py ---
  # List of settings, each with a sub-list of values
  settings = [["volume", 70], ["brightness", 50]]

  # Create a shallow copy
  shallow_copy = settings[:]

  # Modify the inner list in the shallow copy
  shallow_copy[0][1] = 20

  print("Original after shallow copy:", settings)
  print("Shallow copy:", shallow_copy)

  # --- deep_copy.py ---
  import copy

  # List of settings, each with a sub-list of values
  settings = [["volume", 70], ["brightness", 50]]

  # Create a deep copy
  deep_copy = copy.deepcopy(settings)

  # Modify the inner list in the deep copy
  deep_copy[0][1] = 20

  print("Original after deep copy:", settings)
  print("Deep copy:", deep_copy)
```

---

## List Comprehensions and Unpacking

```python
def print_comprehensions_and_unpacking():
  # --- list_comprehension_transforming.py ---
  numbers = [1, 2, 3, 4]
  # Square each number
  # Basic transformation
  squares = [n**2 for n in numbers]

  print("Squares:", squares)

  # --- list_comprehension_filtering.py ---
  numbers = [1, 2, 3, 4]

  # Only keep even numbers
  # Filtering with a condition
  evens = [n for n in numbers if n % 2 == 0]

  print("Even numbers:", evens)

  # --- list_unpacking.py ---
  dimensions = [10, 20, 5]

  # Unpack each element into its own variable
  width, height, depth = dimensions

  print("Width:", width)
  print("Height:", height)
  print("Depth:", depth)

  # --- extended_unpacking.py ---
  http_response = [200, "OK", "Data loaded successfully", "Time: 0.32s"]

  status_code, *message_parts = http_response

  print("Status Code:", status_code)
  print("Message:", message_parts)

  # --- unpacking_value_error.py ---
  user_info = ["Alice", "Engineer", "Canada"]

  # Too many variables
  try:
    name, job, country, age = user_info
  except ValueError as e:
    print("Too many variables:", e)

  # Too few variables
  try:
    name, job = user_info
  except ValueError as e:
    print("Too few variables:", e)

  # --- joining.py ---
  # Parts of a file path
  folders = ["home", "user", "documents", "project"]

  # For Linux/macOS: use '/'
  linux_path = "/".join(folders)
  print("Linux/macOS path:", linux_path)

  # For Windows: use '\\' (escaped backslash)
  windows_path = "\\".join(folders)
  print("Windows path:    ", windows_path)

  # Splitting a path back into parts
  split_folders = linux_path.split("/")
  print("Split folders:   ", split_folders)

  # --- aggregate_functions.py ---
  # Sensor readings
  readings = [0.0, 0.1, 0.0, 0.2]

  print("Sum of values:", sum(readings))
  print("Maximum value:", max(readings))
  print("Minimum value:", min(readings))
  print("Contains any truthy values?", any(readings))
  print("All values are truthy?", all(readings))
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
