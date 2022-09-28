This plugin is a toolbox for working with completed tasks in your markdown files. It brings some
of [org-mode's](https://orgmode.org/) features to Obsidian. It provides features such as archiving, deleting and sorting
tasks and document sections.

## Commands <a id="commands"></a>

<details>
<summary>Archive tasks in this file</summary>

Here is what it looks like:

```md
- [ ] This one I haven't done yet
- [x] Water the dog
    - Some task details
- [x] Feed the plants
```

Turns into:

```md
- [ ] This one I haven't done yet

# Archived

- [x] Water the dog
    - Some task details
- [x] Feed the plants
```

Or, with date tree enabled:

```md
- [ ] This one I haven't done yet

# Archived

- [[2021-09-W-38]]
    - [[2021-09-16]]
        - [x] Water the dog
            - Some task details
        - [x] Feed the plants
```

</details>

<details>
<summary>Delete tasks in this file</summary>

This one is the same as 'Archive tasks in this file', except that the tasks get discarded.

</details>

<details>
<summary>Archive heading under cursor</summary>

Grab the whole section under the heading under cursor, including all the child sections and move it to the archive.

This:

```markdown
Some top-level text

# H1 heading

Some text

## H2 heading

More text
```

Turns into:

```markdown
Some top-level text

# Archived

## H1 heading

Some text

### H2 heading

More text
```

</details>

<details>
<summary>Sort tasks in list under cursor</summary>

Grab the whole list under cursor and **recursively** reorder all the items based on completeness:

1. Plain list items first
2. Then, incomplete tasks
3. And finally, completed tasks

This list:

```markdown
- [x] Task
- Item
- [ ] Incomplete
    - [x] Task
    - Item More notes
    - [ ] Incomplete
- Item 2
- [ ] Incomplete 2
    - [x] Task
    - Item
    - [x] Task 2
```

Turns into:

```markdown
- Item
- Item 2
- [ ] Incomplete
    - Item More notes
    - [ ] Incomplete
    - [x] Task
- [ ] Incomplete 2
    - Item
    - [x] Task
    - [x] Task 2
- [x] Task
```

</details>

<details>
<summary>Turn list items at this level into headings</summary>

Grab the list under cursor and turn every list item at and above the level of the item under cursor into a heading.

This:

```markdown
- li 1
    - li 2 | <- cursor
        - li 3
```

Turns into:

```markdown
# li 1

## li 2

- li 3
```

</details>


<details>
<summary>Archive tasks including nested tasks in this file</summary>

Same as simple archiving, except that now completed nested tasks also get archived, with their sub-items.

This:

```markdown
- [ ] Incomplete task
    - [x] Completed subtask
        - Task details
    - [ ] Incomplete subtask
```

Turns into:

```markdown
- [ ] Incomplete task
    - [ ] Incomplete subtask
  
# Archived

- [x] Completed subtask
    - Task details
```

</details>

## Configuration

The plugin lets you configure the following:

- additional patterns to detect completed tasks (say, only archive tasks with `#task`)
- a regular expression for replacing the contents of the task during archiving; this is useful if you want to strip tags
  from archived tasks
- what text makes a heading an archive;
- whether to add newlines around headings when moving stuff around;
- moving tasks to the current file or to a separate file.

### Date tree

Each checked date tree option (weeks, days) will create an additional level in the archive hierarchy with a link to the
corresponding periodic note.

## Usage

Open the command palette and run one of the archiver [commands](#commands).

## Acknowledgements

This plugin is a simple & incomplete (for now) implementation of the archiving features
of [org-mode](https://orgmode.org/).

Also, I relied on the code from these excellent plugins:

- [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban);
- [obsidian-outliner](https://github.com/vslinko/obsidian-outliner).

### Contributors

- Richard Cook (wealthychef@gmail.com)
