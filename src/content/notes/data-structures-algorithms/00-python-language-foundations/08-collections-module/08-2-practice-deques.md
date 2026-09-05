---
title: "Practice: Collections Module"
description: "The raw practice source behind the Collections Module chapter — runnable demos of defaultdict, Counter, deque, and namedtuple covering initialization, grouping, counting, multiset arithmetic, queue/stack patterns, and named-field records."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031830"
---

# Practice: Collections Module

This is the raw practice corpus behind [[08-1-collections-module|8 — Collections Module]] — one
runnable demo function per `collections` module tool the chapter covers: `defaultdict`, `Counter`,
`deque`, and `namedtuple`. Where the chapter distills each tool down to its core mechanism and a
couple of worked examples, this file keeps every scratch demo written while exploring each tool's
full API surface — grouping, counting, multiset arithmetic, queue/stack/sliding-window patterns, and
immutable named records. None of the functions have been rewritten or bug-fixed here; this is a
structural pass (frontmatter, headings) only, not a correctness review.

---

## `defaultdict`

Auto-vivifying dict demos: initializing with different default factories, using one as a counting
accumulator, comparing it against `dict.setdefault()`, and grouping list items by key — with and
without deduplication via a `set` factory.

```python
def print_defaultdict():
  """
  Demonstrates defaultdict from the collections module.
  defaultdict is a dict subclass that automatically creates a missing value
  using a 'default factory' (a callable) instead of raising KeyError — reach
  for it whenever you group, bucket, or accumulate values by key.
  """
  from collections import defaultdict

  # ----- initializing_defaultdict -----
  # The default value will be an empty list
  # 'list' is the default factory — defaultdict calls list() to produce []
  # whenever a key is accessed for the first time and does not yet exist.
  dd = defaultdict(list)  # this is the list() constructor

  dd["key1"].append(1)  # "key1" doesn't exist yet, so defaultdict creates it with the value []
  # This is equal to
  # dd["key1"] = list()
  # dd["key1].append(1)

  # Even accessing non-existent keys will create them in the dictionary
  print(dd["key3"])
  print(dd)

  # ----- counting_logic -----
  # Sample list of letters
  letters = ["a", "b", "a", "c", "b", "a"]

  letter_counts = defaultdict(int)  # int() will return 0

  for letter in letters:
      letter_counts[letter] += 1

  print(letter_counts)

  # ----- defaultdict_vs_setdefault -----
  std_dict = {}
  std_dict.setdefault("key", "Default")
  print(std_dict)

  # defaultdict only accepts callables as default_factory
  dd = defaultdict(lambda: "Default")
  dd["key"]
  print(dd)

  # ----- grouping_elements -----
  # Sample list of files, each as (filename, filetype)
  files = [
      ("report.docx", "document"),
      ("summary.pdf", "document"),
      ("budget.xlsx", "spreadsheet"),
      ("data.csv", "spreadsheet"),
      ("photo.jpg", "image"),
      ("diagram.png", "image"),
  ]

  # Group files by type
  grouped_files = defaultdict(list)

  for filename, file_type in files:
      grouped_files[file_type].append(filename)

  print(dict(grouped_files))

  # ----- grouping_unique_elements -----
  files = [
      ("report.docx", "document"),
      ("summary.pdf", "document"),
      ("budget.xlsx", "spreadsheet"),
      ("data.csv", "spreadsheet"),
      ("photo.jpg", "image"),
      ("diagram.png", "image"),
      ("photo.jpg", "image"),  # duplicate file
  ]

  # Group files by type with unique entries
  grouped_files = defaultdict(set)

  for filename, file_type in files:
      grouped_files[file_type].add(filename)

  print(dict(grouped_files))
```

---

## `Counter`

Counting demos: building counters from a list, a string, and an existing dict; frequency lookups;
`most_common()` and `total()`; in-place `update()`/`subtract()`; expanding counts with `elements()`;
an anagram check via multiset equality; the `&`/`|` intersection/union operators; the `+`/`-`
operators; and the unary `+counter`/`-counter` forms.

```python
def print_counter():
  """
  Demonstrates Counter from the collections module.
  Counter is a dict subclass designed for counting hashable objects — reach
  for it whenever you need frequency counts, top-N rankings, or multiset math.
  """
  from collections import Counter
  import random

  # ----- creating_counter_dictionaries -----
  letters = ["a", "c", "d", "a", "a", "b"]
  counter_from_list = Counter(letters)
  print(counter_from_list)

  string_word = "consciousness"
  counter_from_string = Counter(string_word)
  print(counter_from_string)

  # Provide initial counts of an existing group of objects
  # counter_from_kwargs = Counter(a=10, b=12, c=11)
  initial_data = {"a": 10, "b": 12, "c": 11}
  counter_from_dict = Counter(initial_data)
  print(counter_from_dict)

  # ----- accessing_counts -----
  # Simulated voting poll: each item is a vote for a programming language
  votes = [
      "Python",
      "JavaScript",
      "Python",
      "Rust",
      "Python",
      "Go",
      "JavaScript",
      "Go",
      "Rust",
      "Rust",
      "Rust",
      "Java",
      "Go",
  ]
  vote_counts = Counter(votes)

  print(vote_counts)
  print("Votes for Python:", vote_counts["Python"])
  print("Votes for Go:", vote_counts["Go"])
  print("Votes for Elixir (not in list):", vote_counts["Elixir"])

  # ----- most_common_and_total -----
  # Visits to web pages
  visits = [
      "home",
      "about",
      "contact",
      "home",
      "about",
      "home",
      "profile",
      "home",
      "about",
      "contact",
  ]
  visit_counts = Counter(visits)

  # Get the top 2 most visited pages (most_common(n) returns the n highest-count items)
  # most_common(n) → list of (element, count) pairs, highest count first; omit n for all items
  most_visited = visit_counts.most_common(2)
  print("Most visited pages:", most_visited)

  # Get all visited pages sorted by count
  # Then we can use slicing to reverse them and limit the result to last two items
  least_visited = visit_counts.most_common()[:-3:-1]
  print("Least visited pages:", least_visited)

  # Get the sum of all counts (total visits)
  print("Total visits:", visit_counts.total())

  # ----- updating_counts -----
  # Initial stock of electronic devices
  stock = Counter({"laptop": 5, "smartphone": 8, "tablet": 4, "monitor": 3, "keyboard": 6})
  print("Initial stock:\t\t", stock)

  # update() adds to existing counts, it doesn't overwrite keys
  monthly_delivery = {"laptop": 3, "smartphone": 5}
  stock.update(monthly_delivery)
  print("Stock after delivery:\t", stock)

  # subtract() reduces counts, values can be negative
  # subtract(iterable_or_mapping) → subtracts counts in-place; unlike '-', allows negative results
  orders = {"laptop": 10, "tablet": 7, "monitor": 2}
  stock.subtract(orders)
  print("Stock after orders:\t", stock)

  # ----- elements_method -----
  # Number of purchased tickets
  tickets = Counter({"participant_01": 5, "participant_02": 2, "participant_03": 3})

  # elements() expands the counts into a list
  # where each item appears as many times as its count
  # elements() → iterator that repeats each key exactly count times (ignores counts ≤ 0)
  ticket_pool = list(tickets.elements())
  print("Ticket pool:", ticket_pool)

  # Simulating chance weighted by frequency
  winner = random.choice(ticket_pool)
  print("\nWinner:", winner)

  # ----- multisets -----
  def is_anagram(word1, word2):
      return Counter(word1) == Counter(word2)

  print('is_anagram("night", "thing"):', is_anagram("night", "thing"))

  # ----- intersection_and_union_operators -----
  # This is an additional example

  # Number of steps in two different fitness apps
  apple_watch = Counter({"walking": 6000, "running": 3000, "stairs": 800, "cycling": 1500})
  fitbit = Counter({"walking": 5500, "running": 3500, "stairs": 900, "swimming": 1200})

  # Keeps only keys present in both counters, using the minimum count for each
  # intersection
  agreed_steps = apple_watch & fitbit
  print("Reliable step counts (minimum from both):")
  print(agreed_steps)

  # Combines all keys, keeping the maximum count per key from either counter
  # union
  max_steps = apple_watch | fitbit
  print("\nTotal possible steps (maximum from either):")
  print(max_steps)

  # ----- using_plus_and_minus -----
  # Books checked out from the library on two different days
  day1_checkouts = Counter({"fiction": 7, "non_fiction": 4, "mystery": 5, "sci_fi": 2})
  day2_checkouts = Counter({"fiction": 5, "non_fiction": 6, "mystery": 8, "fantasy": 3})

  total_checkouts = day1_checkouts + day2_checkouts  # Total Checkouts
  print("Total checkouts (day1 + day2):")
  print(total_checkouts)

  # The negative value for 'fiction' is discarded
  more_on_day2 = day2_checkouts - day1_checkouts  # Increase in day 2 compared to day 1
  print("Checkouts that increased on day 2 (day2 - day1):")
  print(more_on_day2)

  # ----- unary_operators -----
  stock = Counter({"smartphone": 13, "keyboard": 6, "monitor": 1, "laptop": -2, "tablet": -3})

  # Only return items with non-negative counts (what's in stock)
  available_inventory = +stock
  print("Available inventory:\t", available_inventory)

  # Only return items with negative counts, but flip them to positive (shortages/backorders)
  backordered_items = -stock
  print("Backordered items:\t", backordered_items)
```

---

## `deque`

Double-ended queue demos: construction from different iterables; appending/popping from both ends;
`extend()` vs. `extendleft()`; `maxlen=N` bounded (sliding-window) deques; `rotate()`; and three
applied scenarios — a task queue, a bounded browser-history stack, a VIP-aware waitlist, and a
weekly rotation schedule.

```python
def print_deque():
  """
  Demonstrates deque (double-ended queue) from the collections module.
  deque supports O(1) appends and pops from both ends — reach for it instead
  of a list when you need a queue, stack, or sliding window over a sequence.
  """
  from collections import deque
  import time

  # ----- creating_deques -----
  # Create an empty deque
  dq = deque()
  print(dq)

  # Initialize deque with an iterable
  dq = deque((1, 2, 3))  # tuple
  print(dq)

  dq = deque([1, 2, 3])  # list
  print(dq)

  dict1 = {"a": 1, "b": 2, "c": 3}
  dq = deque(dict1.items())  # dictionary view object

  print(dq)

  # ----- appending_and_popping_elements -----
  dq = deque([1])
  print("Initial deque:\t\t", dq)

  # Append elements from both sides
  # Append to the right
  dq.append(2)
  print("After append(2):\t", dq)
  # Append to the left
  dq.appendleft(0)
  print("After appendleft(0):\t", dq)

  # Pop elements from both sides
  # Pop from the right
  dq.pop()
  print("After pop():\t\t", dq)
  # Pop from the left
  popped_el = dq.popleft()
  print("After popleft():\t", dq)
  print("Popped element from the left:", popped_el)

  # ----- extending -----
  dq = deque([1])
  print("Initial deque:")
  print(dq)

  # Add elements to the right
  dq.extend([2, 3])
  print("After extend([2, 3]):")
  print(dq)

  # Add elements to the left, but insert each at the front,
  # so the final order appears reversed
  dq.extendleft([0, -1])
  print("After extendleft([0, -1]):")
  print(dq)

  # ----- bounded_deques -----
  # maxlen=N creates a fixed-size (sliding window) deque: once full, every new
  # item appended to one end automatically discards the item at the opposite end.
  # This is ideal for keeping only the N most recent items (logs, sensor readings, history).
  numbers = deque([0, 1, 2, 3], maxlen=5)
  print("Maxlen:", numbers.maxlen)
  print(numbers)

  # Allowed, because the original deque has just 4 elements
  numbers.appendleft(-1)
  print("After numbers.appendleft(-1):\t", numbers)

  # This will discard the first number -1
  numbers.append(4)
  print("After numbers.append(4):\t", numbers)

  # This will discard the first number 0
  numbers.append(5)
  print("After numbers.append(5):\t", numbers)

  # This will discard the last number 5
  numbers.appendleft(0)
  print("After numbers.appendleft(0):\t", numbers)

  # ----- rotate_method -----
  letters = deque(["a", "b", "c"])
  print(letters)

  # Rotate elements one step to the right
  letters.rotate()
  print("letters.rotate():\t", letters)

  # Rotate elements two steps to the right
  letters.rotate(2)
  print("letters.rotate(2):\t", letters)

  # Rotate elements one step to the left
  letters.rotate(-1)
  print("letters.rotate(-1):\t", letters)

  # ----- implementing_queues -----
  def process_task(task):
      print("Processing task:", task)
      time.sleep(0.5)  # Simulate time-consuming task processing

  task_queue = deque(["task_1", "task_2", "task_3"])
  print(task_queue)

  # Process tasks in the queue
  while task_queue:
      current_task = task_queue.popleft()
      process_task(current_task)

  # ----- implementing_stacks -----
  # Real-world scenario: a browser's Back button — each page visited is pushed
  # onto a bounded stack; pressing Back pops the most-recently visited page.
  # Create a limited-size history stack for browsers back button
  history = deque(maxlen=5)

  def visit_page(url):
      history.append(url)
      print("Visiting:", url)

  def go_back():
      if history:
          current = history.pop()
          print("Going back from:", current)
          if history:
              print("Current page is now:", history[-1])
          else:
              print("No more pages in history.")
      else:
          print("No pages in history.")

  # Example usage
  visit_page("/home")
  visit_page("/about")
  visit_page("/contact")

  go_back()  # contact → about
  go_back()  # about → home

  # ----- deque_waitlist -----
  # Real-world scenario: a restaurant waitlist — regular customers join the back
  # of the queue while VIP customers are inserted at the front, and the host
  # seats whoever is first in line.
  # Create a waitlist deque
  waitlist = deque()

  # Append new elements
  def arrive(name, vip=False):
      if vip:
          waitlist.appendleft(name)
          print(f"VIP customer {name} added to the front of the waitlist.")
      else:
          waitlist.append(name)
          print(f"Customer {name} added to the end of the waitlist.")
      print(waitlist)

  # Remove elements
  def seat_customer():
      if waitlist:
          name = waitlist.popleft()
          print(f"Customer {name} is now being seated.")
      else:
          print("The waitlist is currently empty.")
      print(waitlist)

  # Example usage
  arrive("A")
  arrive("B")
  arrive("C", vip=True)  # VIP

  seat_customer()  # Seats C
  seat_customer()  # Seats A

  # ----- weekly_rotation_example -----
  # Initial weekly schedule for 3 employees
  schedule = deque(["Élodie", "Jisoo", "Nils"])

  # Simulate rotation for 4 weeks
  for week in range(1, 5):
      print(f"Week {week} schedule: {list(schedule)}")
      schedule.rotate()  # Rotate the schedule
```

---

## `namedtuple`

Named-field record demos: creating a namedtuple class; accessing fields by index vs. by name;
building instances from a dict (unpacking) and from a list (`_make`); returning a namedtuple from a
function; trailing-field `defaults`; and updating a field via `_replace`.

```python
def print_namedtuple():
  """
  Demonstrates namedtuple from the collections module.
  namedtuple creates a lightweight, immutable class whose fields are accessed
  by name — prefer it over a plain tuple when field order is hard to remember,
  and over a dict or dataclass when you want guaranteed immutability and low memory overhead.
  """
  from collections import namedtuple

  # ----- creating_named_tuples -----
  # Creating a new tuple subclass (namedtuple class)
  Pixel = namedtuple("Pixel", "red green blue")
  # Pixel = namedtuple("Pixel", "red, green, blue")
  # Pixel = namedtuple("Pixel", ["red", "green", "blue"])

  # Using a namedtuple class to instantiate a new namedtuple object
  # namedtuple instances are immutable — you cannot do pixel.red = 128.
  # Use _replace() to get a new instance with updated fields (see updating_fields_with_replace).
  # pixel = Pixel(255, 0, 0)
  pixel = Pixel(red=255, green=50, blue=0)
  print(pixel)

  # Get a tuple of field names
  print(Pixel._fields)

  # ----- accessing_elements_by_field_names -----
  Pixel = namedtuple("Pixel", "red green blue")
  pixel = Pixel(red=255, green=50, blue=0)

  print("Accessing values by indicies:")
  print(pixel[0])
  print(pixel[1])
  print(pixel[2])

  print("Accessing values by field names with the dot syntax:")
  print(pixel.red)
  print(pixel.green)
  print(pixel.blue)

  # ----- named_tuple_from_dictionaries -----
  Pixel = namedtuple("Pixel", "red green blue")

  # Use dictionary unpacking to unpack key-value pairs to keyword arguments
  pixel = Pixel(**{"red": 255, "green": 50, "blue": 0})
  # Unpacking a dictionary results in:
  # pixel = Pixel(red=255, green=50, blue=0)
  print(pixel)

  # Turn the namedtuple instance to a dictionary
  print(pixel._asdict())

  # ----- named_tuples_from_lists -----
  Pixel = namedtuple("Pixel", "red green blue")

  image_pixel_data = [[255, 43, 22], [230, 44, 23], [230, 44, 23]]

  sprite = [Pixel._make(pixel) for pixel in image_pixel_data]
  print(sprite)

  # ----- return_named_tuple_from_function -----
  Response = namedtuple("Response", "success data error")

  def fetch_data():
      # Simulate success
      return Response(success=True, data="payload", error=None)

  response = fetch_data()
  if response.success:
      print("Data from the response:", response.data)
  else:
      print("Error:", response.error)

  # ----- support_default_values -----
  # The 'defaults' argument
  Dog = namedtuple("Dog", ["name", "age", "location"], defaults=[0, "Home"])
  dog = Dog("Balto")
  print("dog:", dog)
  print("dog._field_defaults:", dog._field_defaults)

  # ----- updating_fields_with_replace -----
  Dog = namedtuple("Dog", ["name", "age", "location"])
  dog = Dog("Hachiko", 11, "Shibuya Station")

  # Create a new Dog instance with the updated value
  dog = dog._replace(name="Scooby-Don't")
  print(dog)
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
