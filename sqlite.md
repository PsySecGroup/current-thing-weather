# Installing SQLite

## Windows

1. **Download SQLite:**
   - Go to the [SQLite Download Page](https://www.sqlite.org/download.html).
   - Under "Precompiled Binaries for Windows", download `sqlite-tools-win32-x86-xxxxxx.zip` (xxxxxx represents the version number).

2. **Extract the ZIP file:**
   - Extract the downloaded ZIP file to a location of your choice, such as `C:\sqlite`.

3. **Add SQLite to the System Path:**
   - Open the Start Menu, search for "Environment Variables", and select "Edit the system environment variables".
   - In the System Properties window, click the "Environment Variables" button.
   - In the Environment Variables window, under "System variables", find and select the `Path` variable, then click "Edit".
   - Click "New" and add the path to the directory where you extracted SQLite (e.g., `C:\sqlite`).
   - Click "OK" to close all windows.

4. **Verify the Installation:**
   - Open Command Prompt and type:
     ```sh
     sqlite3 --version
     ```
   - Ensure that SQLite is correctly installed by checking the version output.

## macOS

1. **Using Homebrew:**
   - If you don't have Homebrew installed, install it by running the following command in the terminal:
     ```sh
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     ```

2. **Install SQLite using Homebrew:**
   ```sh
   brew install sqlite
   ````
## Linux

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install sqlite3
```
`
### Fedora

```bash
sudo dnf install sqlite
````

### Arch Linux

```bash
sudo pacman -S sqlite
```
`
### CentOS/RHEL

```bash
sudo yum install epel-release
sudo yum install sqlite
````
