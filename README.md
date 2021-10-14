This is a simple plugin that moves completed tasks in a file to the "Archived" heading.

This is handy if you like organizing your tasks in an outline: completed tasks don't clutter up your workspace, but you can still see your accomplishments and feel proud about them.

## Here is what it looks like

```md
- [ ] This one I haven't done yet
- [x] Water the dog
    - Some task details
- [x] Feed the plants
```
Turns into
```md
- [ ] This one I haven't done yet

# Archived

- [[2021-09-W-38]]
    - [[2021-09-16]]
        - [x] Water the dog
            - Some task details
        - [x] Feed the plants

```

## Configuration

The plugin lets you configure the following:
- what text makes a heading an archive;
- whether completed tasks should be added under a link to the current week;
- the pattern of the weekly note link.

## Usage

Add an "Archived" Heading to a file and run the following command: "Archive tasks in this file".

## Roadmap

- [ ] Move completed tasks to a separate archive file
- [ ] Per-file configuration through front-matter
- [ ] More options for the date tree
  - [ ] Days
  - [ ] Months
  - [ ] Years
- [ ] Multiple archive subheadings per file

## Acknowledgements

This plugin is a simple & incomplete (for now) implementation of the archiving features of [org-mode](https://orgmode.org/).

Also, I relied on the code from these excellent plugins:
- [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban);
- [obsidian-outliner](https://github.com/vslinko/obsidian-outliner).
