---
title: "Practice Sets — Full Source Catalogue"
description: "The complete set-operations practice corpus behind the Sets chapter — creating, mutating, and iterating sets, subset/superset/disjoint checks, the full union/intersection/difference algebra, and frozensets, as runnable Python grouped by topic."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031828"
---

# Practice Sets — Full Source Catalogue

This is the raw practice corpus behind [[07-1-sets|7 — Sets]] — every set-creation, mutation,
membership-check, comparison, algebra, and frozenset example written while building the intuition
that chapter distills into its own API-surface walkthrough. Where the chapter extracts one or two
worked examples per topic, this note keeps the full, unabridged set: six standalone functions, one
per topic, each still containing every original sub-example exactly as written.

Each section below is a single runnable function — copy the one you need. None of the code has been
rewritten or bug-fixed here; this is a structural pass (frontmatter, headings, grouping) only, not a
correctness review.

---

## Creating Sets

```python
def print_creating_sets():
  """
  Covers: creating sets with literals and set(), aggregate functions,
  uniqueness, and initialising sets from other iterables/strings.
  """
  # --- creating_sets.py ---
  # Set elements have to be immutable
  my_set = {1, 2, 3, "s1", "s2"}
  print("my_set:", my_set)

  # Create empty sets with the set() constructor
  empty_set = set()
  print("empty_set:", empty_set)

  # Empty curly braces would create a dictionary
  # empty_dict = {}

  # --- aggregate_functions.py ---
  numbers_set = {3, 7, 2, 9, 5}

  print("Number of elements:", len(numbers_set))
  print("Sum of elements:", sum(numbers_set))
  print("Smallest element:", min(numbers_set))
  print("Largest element:", max(numbers_set))
  print("Any truthy values?", any(numbers_set))
  print("All truthy values?", all(numbers_set))

  # --- set_elements_are_unique.py ---
  # Set will remove all duplicate elements
  my_set = {1, 2, 3}
  print("my_set:", my_set)

  # You can initialize sets with elements from other iterable structures
  my_tuple = ("a", "b", "c")
  set_from_tuple = set(my_tuple)
  print("set_from_tuple:", set_from_tuple)

  # This can be useful for removing duplicate elements
  visitor_id_list = ["user123", "user456", "user123", "user789", "user456", "user101"]
  unique_visitors_set = set(visitor_id_list)
  print("unique_visitors_set:", unique_visitors_set)

  # --- sets_and_strings.py ---
  # Strings are iterable as well
  string_set = set("Hello")
  print("string_set:", string_set)

  # If you want to store a full string as one item
  string_set = {"Hello"}
  print("string_set:", string_set)
```

---

## Modifying Sets

```python
def print_modifying_sets():
  """
  Covers: add(), update(), remove(), discard(), pop(), and clear() —
  the full set of mutating operations on a regular (mutable) set.
  """
  # --- adding_new_elements.py ---
  # A set of fruits
  fruits = {"apple", "banana"}

  fruits.add("orange")
  print(fruits)

  # Sets cannot contain mutable elements
  try:
      fruits.add(["pear", "grape"])  # Lists are mutable and not hashable
  except TypeError as e:
      print(f"Error adding list: {e}")

  # --- adding_multiple_elements_with_update.py ---
  # A set of vehicles
  vehicles = {"car", "bike"}
  print(vehicles)

  # Add elements from a list
  vehicles.update(["truck", "scooter"])
  print(vehicles)

  # Add elements from another set
  vehicles.update({"boat", "plane"})
  print(vehicles)

  # --- removing_elements_with_remove.py ---
  planets = {"earth", "mars", "venus"}

  planets.remove("mars")
  print(planets)

  # Removing non-existent element will raise a KeyError
  try:
      planets.remove("jupiter")
  except KeyError as e:
      print(f"Error removing planet: {e}")

  # --- removing_elements_with_discard.py ---
  # Key difference from remove(): discard() silently ignores a missing element
  # instead of raising a KeyError — use it when you're unsure if the element exists.
  tools = {"hammer", "wrench", "screwdriver"}

  tools.discard("wrench")
  print(tools)

  tools.discard("drill")  # No error even though 'drill' is not in the set
  print(tools)

  # --- removing_elements_with_pop.py ---
  colors = {"red", "blue", "green"}

  # pop() returns the removed element
  removed_color = colors.pop()
  print(f"Removed: {removed_color}")
  print(f"Remaining colors: {colors}")

  # Empty set would raise KeyError if pop() is used
  # empty_set = set()
  # empty_set.pop()  # Would raise KeyError

  # --- clearing_set_with_clear.py ---
  gadgets = {"phone", "tablet", "laptop"}

  gadgets.clear()
  print(gadgets)
```

---

## Accessing Set Elements

```python
def print_accessing_set_elements():
  """
  Covers: iterating over a set with a for-loop and O(1) membership
  checking — demonstrating why sets are faster than lists for 'in' tests.
  """
  # --- iterating_over_sets.py ---
  # Set of game levels
  levels = {"forest", "desert", "ocean"}

  # The order of iteration is random
  for level in levels:
      print(f"Loading level: {level}")

  # --- sets_membership_checking.py ---
  # Membership checking in sets is fast because sets use a hash table to quickly find elements without searching through all of them.

  import time

  # Create a big list and big set
  big_list = list(range(1_000_000))
  big_set = set(big_list)

  # Element that doesn't exist
  missing_element = -1

  # Time membership check in list
  start = time.time()
  missing_element in big_list
  end = time.time()
  print(f"List membership took {end - start:.6f} seconds")

  # Time membership check in set
  start = time.time()
  missing_element in big_set
  end = time.time()
  print(f"Set membership took  {end - start:.6f} seconds")
```

---

## Supersets and Subsets

```python
def print_supersets_and_subsets():
  """
  Covers: issubset(), issuperset(), isdisjoint(), and the < / >= operators
  for testing proper and improper subset/superset relationships.
  """
  # --- check_issubset.py ---
  # Set of my ingredients
  ingredients_at_home = {"flour", "sugar", "eggs", "milk"}

  # Subset we need for pancakes
  pancake_ingredients = {"flour", "milk"}

  print("Are all the pancake ingredients available at my home?")
  print(pancake_ingredients.issubset(ingredients_at_home))  # True if every element of pancake_ingredients is also in ingredients_at_home

  # Operator alternative:
  # print(pancake_ingredients <= ingredients_at_home)

  # --- check_issuperset.py ---
  # Set of available tools
  my_tools = {"hammer", "wrench", "screwdriver", "pliers"}

  # Tools needed for building a chair
  chair_tools = {"hammer", "screwdriver"}

  print("Do my tools cover everything needed to build the chair?")
  print(my_tools.issuperset(chair_tools))  # True if my_tools contains every element of chair_tools (and possibly more)

  # Operator alternative:
  # print(my_tools >= chair_tools)

  # --- check_isdisjoint.py ---
  # Set of known allergens
  allergens = {"peanuts", "gluten", "soy", "dairy"}

  # Ingredients in a chocolate bar
  chocolate_bar_ingredients = {"cocoa", "sugar", "dairy", "vanilla"}
  # Ingredients in a fruit salad
  fruit_salad_ingredients = {"apple", "banana", "grapes", "melon"}

  print("Is the chocolate bar free from allergens?")
  print(allergens.isdisjoint(chocolate_bar_ingredients))  # True if the two sets share no elements at all

  print("Is the fruit salad free from allergens?")
  print(allergens.isdisjoint(fruit_salad_ingredients))  # True if the two sets share no elements at all

  # --- proper_supersets_subsets.py ---
  A = {1, 2, 3}
  B = {1, 2}
  C = {1, 2, 3}

  # Proper Subset
  print("Is B a proper subset of A?", B < A)

  # Improper Superset (sets are equal)
  print("Is C a superset (proper or improper) of A?", C >= A)
```

---

## Set Operations

```python
def print_set_operations():
  """
  Covers: union, intersection, difference, and symmetric difference —
  both the method form (.union() etc.) and the in-place update variants.
  """
  # --- union.py ---
  # Interests of Group A
  group_a_interests = {"hiking", "photography", "traveling", "cooking"}
  # Interests of Group B
  group_b_interests = {"traveling", "gaming", "cooking", "painting"}

  # Elements in either set (all unique items from both combined)
  # Union -> All unique interests from both groups combined
  print("What are all the interests across both groups?")
  print(group_a_interests.union(group_b_interests))

  # Operator alternative:
  print(group_a_interests | group_b_interests)

  # --- update_union.py ---
  # Skills I currently have
  my_skills = {"Python", "SQL", "HTML"}
  print("My initial skills:", my_skills)

  # New skills from an online course
  course_skills = {"Python", "Java", "C++"}
  print("Skills that I can learn from the course:", course_skills)

  # Using update() method (Union)
  # Include all of the skills from my_skills and course_skills
  my_skills.update(course_skills)
  print("\nMy skills after taking the course (update):", my_skills)

  # Operator alternative:
  # my_skills = my_skills | course_skills
  # Or in short:
  # my_skills |= course_skills

  # --- intersection.py ---
  # Interests of Group A
  group_a_interests = {"hiking", "photography", "traveling", "cooking"}
  # Interests of Group B
  group_b_interests = {"traveling", "gaming", "cooking", "painting"}

  # Elements present in BOTH sets (the overlap)
  # Intersection -> Interests both groups share
  print("What interests do both groups have in common?")
  print(group_a_interests.intersection(group_b_interests))

  # Operator alternative:
  print(group_a_interests & group_b_interests)

  # --- intersection_update.py ---
  my_skills = {"Python", "SQL", "HTML", "Java", "C++"}
  print("My skills:", my_skills)

  # Skills required for a job offer
  job_required_skills = {"Python", "SQL", "AWS"}
  print("Job required skills:", job_required_skills)

  # Using intersection_update() method (Intersection)
  # Only leave the skills that are also present in the job_required_skills
  my_skills.intersection_update(job_required_skills)
  print("\nRequired skills from the job that I have (intersection_update):", my_skills)

  # Operator alternative:
  # my_skills = my_skills & job_required_skills
  # Or in short:
  # my_skills &= job_required_skills

  # --- difference.py ---
  # Interests of Group A
  group_a_interests = {"hiking", "photography", "traveling", "cooking"}
  # Interests of Group B
  group_b_interests = {"traveling", "gaming", "cooking", "painting"}

  # Elements in the left set that are NOT in the right set (one-sided subtraction)
  # Difference -> Interests that are in Group A but not in Group B.
  print("What interests are unique to Group A?")
  print(group_a_interests.difference(group_b_interests))
  # Operator alternative:
  print(group_a_interests - group_b_interests)

  # Difference -> Interests that are in Group B but not in Group A.
  print("What interests are unique to Group B?")
  print(group_b_interests.difference(group_a_interests))
  # Operator alternative:
  print(group_b_interests - group_a_interests)

  # --- difference_update.py ---
  my_skills = {"Python", "SQL"}
  print("My skills:", my_skills)

  # Skills trending in the industry
  trending_skills = {"Python", "Rust", "C++", "AWS"}
  print("Trending skills:", trending_skills)

  # Using difference_update() method (Difference)
  # Remove from my_skills anything that also appears in trending_skills
  my_skills.difference_update(trending_skills)
  print("\nMy skills which are not trending (difference_update):", my_skills)

  # Operator alternative:
  # my_skills = my_skills - trending_skills
  # Or in short:
  # my_skills -= trending_skills

  # --- symmetric_difference.py ---
  # Interests of Group A
  group_a_interests = {"hiking", "photography", "traveling", "cooking"}
  # Interests of Group B
  group_b_interests = {"traveling", "gaming", "cooking", "painting"}

  # Elements in either set but NOT in both (the non-overlapping parts of each set)
  # Symmetric Difference -> Interests in either Group A or Group B, but not both
  print("What interests are different between the groups (not shared)?")
  print(group_a_interests.symmetric_difference(group_b_interests))

  # Operator alternative:
  print(group_a_interests ^ group_b_interests)

  # --- symmetric_difference_update.py ---
  # Files currently on my laptop
  current_system_files = {"project.docx", "report.pdf", "photo1.jpg", "photo2.jpg"}
  print("Current system files:", current_system_files)

  # Files saved on my backup hard drive
  backup_drive_files = {"project.docx", "report.pdf", "photo1.jpg", "photo3.jpg"}
  print("Backup drive files:", backup_drive_files)

  # Using symmetric_difference_update() method (Symmetric Difference)
  # Only keep the files which do not appear in both locations
  current_system_files.symmetric_difference_update(backup_drive_files)
  print(
      "\nFiles missing from backup or deleted from system (symmetric_difference_update):",
      current_system_files,
  )

  # Operator alternative:
  # current_system_files = current_system_files ^ backup_drive_files
  # Or in short:
  # current_system_files ^= backup_drive_files
```

---

## Frozen Sets

```python
def print_frozen_sets():
  """
  Covers: frozenset basics, using frozensets as dict keys or set elements —
  which is impossible with regular sets because regular sets are mutable (unhashable).
  """
  # --- frozen_sets.py ---
  # Frozenset Basics
  # Frozen sets are immutable versions of sets; because they cannot change,
  # Python can hash them — making them valid as dictionary keys or as
  # elements inside another set. Regular (mutable) sets cannot be hashed.

  # Creating a frozenset
  fset = frozenset(["tomato", "banana", "cherry"])

  # Frozensets are immutable: you cannot add, remove, or change elements
  try:
      fset.add("orange")
  except AttributeError as e:
      print("Error:", e)
      print("Frozensets are immutable — you cannot add or remove elements.")

  # --- partial_matches_example.py ---
  # Set up recipes (ingredients stored in frozensets)
  recipes = {
      "Cake": frozenset(["flour", "sugar", "eggs"]),
      "Pancakes": frozenset(["flour", "milk", "eggs"]),
      "Omelette": frozenset(["eggs", "milk", "cheese"]),
  }

  # Ingredients you have at home
  available_ingredients = {"flour", "milk"}

  # Find possible recipes you can ALMOST make
  for recipe_name, ingredients_needed in recipes.items():
      missing_ingredients = ingredients_needed - available_ingredients
      if len(missing_ingredients) <= 1:
          print(f"You can almost make {recipe_name}! Missing: {missing_ingredients}")

  # --- prevent_set_modifications.py ---
  admin_permissions = frozenset(["read", "write", "delete"])
  user_permissions = frozenset(["read"])

  def can_do(permissions, action):
      return action in permissions

  # Example usage:
  print(can_do(admin_permissions, "delete"))
  print(can_do(user_permissions, "delete"))

  # This will raise an error:
  # admin_permissions.add("export")  # AttributeError: 'frozenset' object has no attribute 'add'

  # --- set_as_dictionary_keys.py ---
  # Mapping ingredients to recipes
  recipes = {
      frozenset(["flour", "sugar", "eggs"]): "Cake",
      frozenset(["flour", "milk", "eggs"]): "Pancakes",
  }

  # Search by available ingredients
  available = frozenset(["milk", "eggs", "flour"])  # Order doesn't have to match in sets
  print(recipes.get(available))

  # --- sets_inside_other_sets.py ---
  # Frozensets of the harmonized C major scale triads
  c_major_triads = {
      frozenset(["C", "E", "G"]),  # C major (I)
      frozenset(["D", "F", "A"]),  # D minor (ii)
      frozenset(["E", "G", "B"]),  # E minor (iii)
      frozenset(["F", "A", "C"]),  # F major (IV)
      frozenset(["G", "B", "D"]),  # G major (V)
      frozenset(["A", "C", "E"]),  # A minor (vi)
      frozenset(["B", "D", "F"]),  # B diminished (vii°)
  }

  # Notes played by a guitarist (could include repeated notes)
  played_notes = ["E", "B", "E", "G", "B", "E"]
  # Remove duplicates by turning into a set
  unique_played_notes = set(played_notes)  # set("E", "B", "G")

  # Check if the played notes form a valid triad from the C major harmonization
  if frozenset(unique_played_notes) in c_major_triads:
      print("You played a valid triad from the C major scale!")
  else:
      print("Not a triad from the C major scale.")
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
