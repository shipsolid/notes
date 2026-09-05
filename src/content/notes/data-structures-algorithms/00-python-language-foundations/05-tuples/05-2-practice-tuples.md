---
title: "Practice: Tuples"
description: "The raw practice source behind the Tuples chapter — tuple immutability, basic operations (concatenation, membership, aggregates), reversing/sorting, shallow vs. deep cloning, and packing/unpacking for multi-value returns, as runnable Python functions."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031822"
---

# Practice: Tuples

This is the raw practice source behind [[05-1-tuples|5 — Tuples]] — the scratch functions written
while working through tuple immutability, the read-only operations tuples share with lists, and the
packing/unpacking machinery that makes a tuple Python's native multi-value-return mechanism. None of
it has been rewritten or bug-fixed here; this is a structural pass (frontmatter, headings) only, not
a correctness review.

## Tuples Are Immutable

```python
def print_tuples_immutable():
    # --- creating_tuples.py ---
    empty_tuple = ()
    print(empty_tuple)

    # Trailing comma is required
    one_element_tuple = (42,)
    print(one_element_tuple)

    multiple_elements = (1, "apple", 3.14)
    print(multiple_elements)
    print("Length of a tuple:", len(multiple_elements))

    # Tuple without parentheses
    implicit_tuple = 10, 20, 30
    print(implicit_tuple)

    # --- accessing_tuple_elements.py ---
    # RGB color for a soft purple
    rgb_color = (150, 100, 200)

    print("RGB Color:", rgb_color)
    print("Red component:", rgb_color[0])
    print("Green component:", rgb_color[1])
    print("Blue component:", rgb_color[2])

    # --- tuples_are_immutable.py ---
    rgb_color = (150, 100, 200)

    # Attempt to change the second element
    try:
        rgb_color[1] = 10
    except TypeError as e:
        print("Error:", e)

    # --- coordinates_example_with_tuples.py ---
    def calculate_distance(coord1, coord2):
        # A simple Euclidean distance calculation for demonstration
        return ((coord1[0] - coord2[0]) ** 2 + (coord1[1] - coord2[1]) ** 2) ** 0.5

    # Coordinates as tuples
    point_a = (40.7128, -74.0060)  # New York
    point_b = (34.0522, -118.2437)  # Los Angeles

    distance = calculate_distance(point_a, point_b)
    print(f"Distance: {distance} units")
```

## Basic Tuple Operations

```python
def print_basic_operations():
    # --- tuple_operations.py ---
    # Temperature readings from different regions
    north_region = (21.5, 23.0)
    south_region = (19.8, 22.1)
    east_region = (21.5, 24.0)

    # Concatenation
    all_readings = north_region + south_region + east_region
    print("Concatenated Temperatures:", all_readings)

    # Iteration through readings
    print("\nTemperature Analysis:")
    for temp in all_readings:
        print(f"- Recorded {temp}°C")

    # Count and index operations
    target_temp = 21.5
    print(f"\nTemperature Statistics for {target_temp}°C:")
    print("Occurrences:", all_readings.count(target_temp))
    print("First recorded at index:", all_readings.index(target_temp))

    # Membership check
    user_query = 22.1
    if user_query in all_readings:
        print(f"\n{user_query}°C was recorded in our data")
    else:
        print(f"\n{user_query}°C was not found in our records")

    # Aggregate functions
    print("\nSystem-wide Statistics:")
    print("Maximum Temperature:", max(all_readings))
    print("Minimum Temperature:", min(all_readings))
    print("Total Temperature Sum:", sum(all_readings))
    # You can also use any() and all()
```

## Reversing and Sorting Tuples

```python
def print_reversing_and_sorting():
    # --- reversing_tuple.py ---
    steps = ("start", "load data", "process", "validate", "save", "end")

    # reversed() returns an iterator
    reversed_steps = tuple(reversed(steps))
    print("Reversed tuple:", reversed_steps)

    reversed_steps_slice = steps[::-1]
    print("Reversed tuple (using slicing):", reversed_steps_slice)

    # --- reversing_tuple_performance.py ---
    import time

    huge_tuple = tuple(range(100_000_000))  # 100 million items

    # Using reversed() — lazy
    start = time.time()
    for i in reversed(huge_tuple):
        break
    end = time.time()
    print("Time with reversed():", round(end - start, 4), "seconds")

    # Using slicing — eager
    start = time.time()
    for i in huge_tuple[::-1]:
        break
    end = time.time()
    print("Time with slicing:", round(end - start, 4), "seconds")

    # --- sorting_tuples.py ---
    values = (42, 5, 12, 99, 18)

    # sorted() returns a list
    sorted_values = tuple(sorted(values))
    print("Sorted values:", sorted_values)

    # --- sorting_with_key.py ---
    records = (
        ("sensor1", 30),
        ("sensor2", 25),
        ("sensor3", 40),
    )

    sorted_by_value = tuple(sorted(records, key=lambda x: x[1]))
    print("Sorted by sensor reading:", sorted_by_value)

    products = (
        ("product_a", 120, 10),
        ("product_b", 200, 100),
        ("product_c", 150, 20),
    )  # (name, price, discount)

    # Sort by final price after discount
    sorted_by_final_price = tuple(sorted(products, key=lambda x: x[1] - x[2]))
    print("Sorted by final price:", sorted_by_final_price)
```

## Cloning Tuples

```python
def print_cloning_tuples():
    # --- alias_and_shallow_copy.py ---
    # List of enabled modules
    modules = ("core", "auth", "storage")

    # Alias points to the same tuple in memory
    alias = modules
    # Create a shallow copy using slicing
    copied = modules[:]
    # Or you can use the tuple constructor
    # copied = tuple(modules)

    print("modules is alias:", modules is alias)
    print("modules is copied:", modules is copied)

    # --- deep_copy.py ---
    import copy

    # Tuple of settings, each with a sub-list of values
    settings = (["volume", 70], ["brightness", 50])

    # Create a deep copy
    deep_copy = copy.deepcopy(settings)

    # Modify the inner list in the deep copy
    deep_copy[0][1] = 20

    print("Original after deep copy:", settings)
    print("Deep copy:", deep_copy)
```

## Tuple Packing and Unpacking with Functions

```python
def print_packing_and_unpacking():
    # --- tuple_unpacking.py ---
    def compute_volume(length, width, height):
        return length * width * height

    dimensions = (10, 5, 2)
    length, width, height = dimensions

    volume = compute_volume(length, width, height)
    print("Volume:", volume)

    # --- tuple_unpacking_function_call.py ---
    def compute_volume(length, width, height):
        return length * width * height

    dimensions = (10, 5, 2)

    # Unpacking with *
    volume = compute_volume(*dimensions)
    print("Volume:", volume)

    # --- returning_multuple_values_from_a_function.py ---
    def min_max(numbers):
        return min(numbers), max(numbers)

    n = [1, 20, 33, 401, 5]
    min_result, max_result = min_max(n)
    print(f"Min is {min_result} and max is {max_result}")

    # --- packing_function_args.py ---
    # Packing with *
    def sum_numbers(*args):
        print("args:", args)
        return sum(args)

    print("Sum:", sum_numbers(1, 2, 3))
    print("Sum:", sum_numbers(1, 2, 3, 4, 5))

    # --- packing_function_args_with_positional_parameters.py ---
    def generate_report(title, *sections):
        print(f"=== {title} ===")
        for i, section in enumerate(sections, 1):
            print(f"{i}. {section}")

    generate_report("System Health Report", "CPU usage: 47%", "RAM usage: 68%", "Disk I/O: Normal")
```

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
