---
title: "Practice: Dictionaries"
description: "The raw practice corpus behind the Dictionaries chapter — creating, reading, updating, removing, sorting, aggregating over values, iterating, copying, and unpacking dicts as keyword arguments, as runnable Python grouped by topic."
tags: ["data-structures-algorithms", "python-foundations", "reference"]
updated: 2026-08-03
hidden: false
zettelId: "202608031829"
---

# Practice: Dictionaries

This is the raw practice corpus behind [[06-1-dictionaries|6 — Dictionaries]] — every dict drill
written while building the intuition that chapter distills into worked examples and API notes. Each
section below is a standalone, runnable function covering one subtopic: creating dicts, reading them
safely, adding/updating/merging, removing items, sorting, aggregate functions, iterating, copying,
and unpacking as keyword arguments. None of it has been rewritten or bug-fixed here — this is a
structural pass (frontmatter, headings, code fencing) only, not a correctness review.

---

## Creating Dictionaries

```python
def print_creating_dicts():
    """
    Subtopic: Creating Dictionaries.
    Shows three ways to create a dict: literal syntax, empty dict, and dict.fromkeys().
    """
    settings_dict = {"resolution": "1920x1080", "fullscreen": True, "volume": 75}
    print("Settings dictionary:", settings_dict)
    print("Length of a dictionary:", len(settings_dict))

    empty_dict = {}
    print("Empty dictionary: ", empty_dict)

    # using_fromkeys.py
    permissions = ["read", "write", "delete", "export"]
    default_permissions = dict.fromkeys(permissions, False)

    print(default_permissions)
```

---

## Accessing Dictionary Items

```python
def print_accessing_items():
    """
    Subtopic: Accessing Dictionary Items.
    Covers square-bracket access, .get() with defaults, key existence checks, setdefault(), and nested dicts.
    """
    # accessing_with_key.py
    config = {"resolution": "1920x1080", "fullscreen": True}

    print(config["resolution"])

    # accessing_nonexistent_keys.py
    config = {"resolution": "1920x1080", "fullscreen": True}

    try:
        print(config["brightness"])  # This key doesn't exist
    except KeyError:
        print("The 'brightness' setting is missing.")

    # accessing_elements_with_get.py
    config = {"resolution": "1920x1080", "fullscreen": True}

    resolution = config.get("resolution", "[MISSING: Set default resolution]")
    print("Resolution:", resolution)

    brightness = config.get(
        "brightness", "[MISSING: Set default brightness]"
    )  # Default to a warning message
    print("Brightness:", brightness)

    language = config.get("language", "en")  # Default to English
    print("Selected language:", language)

    print("Theme:", config.get("theme"))  # This non-existent key will NOT raise a KeyError

    # checking_if_the_key_exists.py
    config = {"resolution": "1920x1080", "fullscreen": True}

    # Check if the key is NOT present
    if "brightness" not in config:
        print("The 'brightness' setting is missing.")
    else:
        print("Brightness is:", config["brightness"])

    # Check if the key is present
    if "resolution" in config:
        print("Resolution is:", config["resolution"])
    else:
        print("The 'resolution' setting is missing.")

    # default_values_with_setdefaults.py
    user = {"username": "data_builder"}

    user_role = user.setdefault(
        "role", "viewer"
    )  # If the key doesn't exist, add it with the default value
    print("User's role:", user_role)

    username = user.setdefault(
        "username", "data_tester"
    )  # If the key exists, return its corresponding value
    print("Username:", username)

    print(user)

    # nested_dictionaries.py
    user_preferences = {
        "userX": {
            "email": "userx@example.com",
            "preferences": {"theme": "dark", "notifications": True},
        },
        "userY": {
            "email": "usery@example.com",
            "preferences": {"theme": "light", "notifications": False},
        },
    }
    # Chain square-bracket lookups to drill into nested dicts:
    # user_preferences["userX"] → inner dict for userX
    # ["preferences"]           → the nested "preferences" dict
    # ["theme"]                 → the final value
    print("User X theme:", user_preferences["userX"]["preferences"]["theme"])
```

---

## Adding and Updating Items

```python
def print_adding_updating_items():
    """
    Subtopic: Adding and Updating Items.
    Demonstrates direct key assignment, .update(), the | merge operator, and the |= in-place merge.
    """
    # adding_and_updating_items.py
    sensors = {"temperature": "22°C"}

    sensors["humidity"] = "60%"  # Add new sensor reading
    sensors["temperature"] = "23°C"  # Update reading

    print(sensors)

    # updating_with_update.py
    global_settings = {"sampling_rate": 60, "units": "metric", "precision": 2}

    device_overrides = {
        "precision": 3,  # existing key
        "units": "imperial",  # existing key
        "calibration_offset": 0.05,  # new key
    }

    global_settings.update(device_overrides)

    print(global_settings)

    # merge_operator.py
    global_settings = {"sampling_rate": 60, "units": "metric", "precision": 2}

    device_overrides = {
        "precision": 3,  # existing key
        "units": "imperial",  # existing key
        "calibration_offset": 0.05,  # new key
    }

    # Returns a new dictionary
    new_settings = global_settings | device_overrides

    print(new_settings)

    # merge_update_operator.py
    global_settings = {"sampling_rate": 60, "units": "metric", "precision": 2}

    device_overrides = {
        "precision": 3,  # existing key
        "units": "imperial",  # existing key
        "calibration_offset": 0.05,  # new key
    }

    global_settings |= device_overrides

    print(global_settings)
```

---

## Removing Items

```python
def print_removing_items():
    """
    Subtopic: Removing Items.
    Shows five removal approaches: del, pop(), pop() with default, popitem(), and clear().
    """
    # using_del.py
    sensors = {"temperature": "22°C", "humidity": "60%", "pressure": "1013 hPa"}

    # If the key doesn't exist, del will raise a KeyError
    del sensors["humidity"]

    print(sensors)

    # using_pop.py
    sensors = {"temperature": "22°C", "humidity": "60%", "pressure": "1013 hPa"}
    # pop() will return the value of the removed element
    value = sensors.pop("pressure")

    print(value)
    print(sensors)

    # using_pop_with_default_value.py
    sensors = {"temperature": "22°C"}

    # If the default value is not provided for non-existent keys, pop() will raise a KeyError
    value = sensors.pop("pressure", "Preassure is not found")
    print(value)

    # using_popitem.py
    sensors = {"temperature": "22°C", "humidity": "60%", "pressure": "1013 hPa"}

    # popitem() will remove and return the last key-value pair
    last_element = sensors.popitem()

    print(last_element)
    print(sensors)

    # using_clear.py
    sensors = {"temperature": "22°C", "humidity": "60%", "pressure": "1013 hPa"}

    sensors.clear()
    print(sensors)
```

---

## Sorting Dictionaries

```python
def print_sorting_dicts():
    """
    Subtopic: Sorting Dictionaries.
    Shows how to sort by key and by value using sorted(), lambda, and itemgetter.
    """
    # view_objects_with_items.py
    prices = {"keyboard": 29.99, "monitor": 189.99, "mouse": 19.99, "chair": 120.00}

    # Quick reference: .items() returns a dict_items view of (key, value) pairs — not a plain list
    print(prices.items())

    # sorting_dictionaries_by_key.py
    prices = {"keyboard": 29.99, "monitor": 189.99, "mouse": 19.99, "chair": 120.00}
    print(prices.items())  # Quick reference: inspect the unsorted view before sorting

    # sorted() iterates over (key, value) tuples; without a key= arg it sorts by the first element (key)
    # dict() wraps the sorted result back into a regular dictionary
    alphabetical = dict(sorted(prices.items()))

    print(alphabetical)

    # sorting_dictionaries_by_value.py
    prices = {"keyboard": 29.99, "monitor": 189.99, "mouse": 19.99, "chair": 120.00}

    print(prices.items())  # Quick reference: inspect the unsorted view before sorting

    # item[1] from the key argument refers to the view object returned from items()
    # Each 'item' is a (key, value) tuple; item[0] = key, item[1] = value
    # The lambda tells sorted() to rank entries by their numeric value instead of their key string
    sorted_prices = dict(sorted(prices.items(), key=lambda item: item[1]))

    print(sorted_prices)

    # sorting_dictionaries_by_value_with_itemgetter.py
    from operator import itemgetter

    prices = {"keyboard": 29.99, "monitor": 189.99, "mouse": 19.99, "chair": 120.00}

    # itemgetter(1) does the same job as lambda item: item[1] but is faster and more readable
    sorted_prices_getter = dict(sorted(prices.items(), key=itemgetter(1)))
    print("Sorted with itemgetter:", sorted_prices_getter)
```

---

## Dictionary Aggregate Functions

```python
def print_aggregate_functions():
    """
    Subtopic: Dictionary Aggregate Functions.
    Shows how to apply len, sum, max, min, all, and any directly to a dict's .values() view.
    """
    # view_object_with_values.py
    uptime_hours = {
        "server1": 120,
        "server2": 98,
        "server3": 143,
        "server4": 0,  # offline
    }

    print(uptime_hours.values())

    # aggregate_functions.py
    uptime_hours = {
        "server1": 120,
        "server2": 98,
        "server3": 143,
        "server4": 0,  # offline
    }

    values = uptime_hours.values()

    print("Total servers:", len(values))  # Total number of servers
    print("Total uptime:", sum(values))  # Combined uptime
    print("Max uptime:", max(values))  # Longest running server
    print("Min uptime:", min(values))  # Shortest (could be 0)
    print("All running?", all(values))  # False if any value is 0
    print("Any running?", any(values))  # True if at least one is > 0
```

---

## Iterating over a Dictionary

```python
def print_iterating_over_dicts():
    """
    Subtopic: Iterating over a Dictionary.
    Covers looping over keys, values, and (key, value) pairs, plus dict comprehensions.
    """
    # iterating_over_keys.py
    status_messages = {200: "OK", 404: "Not Found", 500: "Server Error", 403: "Forbidden"}

    for code in status_messages:
        print("Status code:", code)


    # You can be more explicit with keys() method, but this is not a common practice anymore
    for code in status_messages.keys():
        print("Status code:", code)

    # iterating_over_values.py
    status_messages = {200: "OK", 404: "Not Found", 500: "Server Error", 403: "Forbidden"}

    for message in status_messages.values():
        print("Message:", message)


    # This is less efficient and less explicit
    for code in status_messages:
        print("Message:", status_messages[code])

    # iterating_over_items.py
    status_messages = {200: "OK", 404: "Not Found", 500: "Server Error", 403: "Forbidden"}

    for code, message in status_messages.items():
        print(f"{code}: {message}")

    # transforming_dict_with_dict_comprehension.py
    # File sizes in MB
    file_sizes = {"report.pdf": 4, "photo.png": 2, "data.csv": 12}

    # Convert file sizes to KB
    sizes_kb = {filename: size * 1024 for filename, size in file_sizes.items()}

    print(sizes_kb)
```

---

## Copying Dictionaries

```python
def print_copying_dicts():
    """
    Subtopic: Copying Dictionaries.
    Contrasts aliasing (same object), shallow copy (.copy()), and deep copy (copy.deepcopy()).
    """
    # alias.py
    original = {"theme": "dark"}

    alias = original

    alias["theme"] = "light"

    print("original:", original)
    print("alias:", alias)

    # shallow_copy.py
    original = {"theme": "dark"}

    shallow_copy = original.copy()
    # You can also use dict()
    # shallow_copy = dict(original)

    shallow_copy["theme"] = "light"

    print("original:", original)
    print("shallow_copy:", shallow_copy)

    # deepcopy.py
    import copy

    original = {"theme": "dark", "options": {"autosave": True}}

    deep_copy = copy.deepcopy(original)

    deep_copy["options"]["autosave"] = False

    print("original:", original)
    print("deep_copy:", deep_copy)
```

---

## Dictionaries as Keyword Arguments

```python
def print_dicts_as_kwargs():
    """
    Subtopic: Dictionaries as Keyword Arguments.
    Shows how ** unpacks a dict into named function parameters, and how **kwargs collects extras.
    """
    # unpacking_dictionaries.py
    def greet(greeting, name):
        print(f"{greeting}, {name}!")


    # Positional arguments
    greet("Welcome", "Guest")

    # Keyword Arguments
    greet(greeting="Good evening", name="Visitor")

    kwargs = {"greeting": "Hello", "name": "Traveler"}

    # ** (double-star) unpacking: the dict's keys must exactly match the function's parameter names.
    # Python expands kwargs into individual keyword arguments before the call is made,
    # so greet(**kwargs) is identical to greet(greeting="Hello", name="Traveler").
    greet(**kwargs)
    # This is equal to calling:
    # greet(greeting=kwargs["greeting"], name=kwargs["name"])

    # unpacking_dictionaries_wrong_parameters.py
    def greet(greeting, name):
        print(f"{greeting}, {name}!")


    wrong_kwargs = {"salutation": "Hey", "name": "Guest"}  # 'salutation' doesn't match parameter name

    try:
        greet(**wrong_kwargs)
    except TypeError as e:
        print("TypeError caught:", e)

    # packing_keyword_arguments.py
    # **kwargs in a function SIGNATURE does the reverse of unpacking:
    # it COLLECTS any extra keyword arguments passed by the caller into a single dict.
    # Here, 'user' and 'location' are not named parameters — they get packed into 'metadata'.
    def log_event(event_type, **metadata):
        print("Event:", event_type)
        print("Details:", metadata)


    log_event("login", user="anon", location="unknown")

    # html_tag_example.py
    def html_tag(tag, content, **kwargs):
        """
        Returns a string representation of an HTML tag.

        :param tag: The HTML tag name.
        :param content: The content inside the tag.
        :param kwargs: Optional HTML attributes for the tag.
        """
        print("kwargs:", kwargs)
        # Build a list of 'key="value"' strings from kwargs, then join them with spaces
        # e.g. kwargs = {"href": "...", "style": "..."} → 'href="..." style="..."'
        attributes = " ".join([f'{key}="{value}"' for key, value in kwargs.items()])
        return f"<{tag} {attributes}>{content}</{tag}>"


    # Example usage
    print(html_tag("a", "Click Here", href="https://example.com", style="color: red;"))
```

---

## Metadata

|        |                            |
| ------ | -------------------------- |
| Author | Amit Singh                 |
| Scope  | data-structures-algorithms |
