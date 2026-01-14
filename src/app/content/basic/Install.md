# Installation and Setup

## Installing MongoDB Community Edition

MongoDB Community Edition is the free, open-source version of MongoDB. Here's how to install it on different operating systems.

### Windows Installation

1. Download the MongoDB Community Edition installer from the official MongoDB website
2. Run the `.msi` installer file
3. Follow the installation wizard and choose your installation path
4. Select "Install MongoDB as a Service" to run MongoDB automatically on startup
5. Complete the installation and MongoDB will start automatically
6. Verify the installation by opening Command Prompt and running `mongod --version`

### macOS Installation

Using Homebrew (recommended):

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Verify installation with:
```bash
mongod --version
```

### Linux Installation (Ubuntu/Debian)

1. Import the MongoDB public key:
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
```

2. Add MongoDB repository:
```bash
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

3. Install MongoDB:
```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
```

4. Start MongoDB service:
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

Verify installation with:
```bash
mongod --version
```

## Installing MongoDB Enterprise Edition

MongoDB Enterprise Edition provides additional features like LDAP support and encryption. It requires a subscription.

1. Register for MongoDB Enterprise on the MongoDB website
2. Download the Enterprise Edition installer for your operating system
3. Follow the same installation steps as Community Edition
4. MongoDB Enterprise includes advanced security and management features
5. Verify with `mongod --version` (will show Enterprise in the output)

## MongoDB Atlas (Cloud Setup)

MongoDB Atlas is the easiest way to get started with MongoDB in the cloud, with no infrastructure to manage.

### Creating a MongoDB Atlas Account

1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Sign Up" and create a free account
3. Verify your email address
4. Complete your user profile information

### Setting Up Your First Cluster

1. After logging in, click "Create a Deployment"
2. Choose "M0" (Free Tier) for testing and development
3. Select your cloud provider (AWS, Google Cloud, or Azure)
4. Choose your region based on your location
5. Set a cluster name (e.g., "MyFirstCluster")
6. Click "Create Deployment"
7. Set up database access credentials:
   - Click "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password
   - Set user privileges (choose "Atlas admin" for full access)
8. Configure network access:
   - Click "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, specify your application's IP address

### Getting Your Connection String

1. Click "Databases" in the left sidebar
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Choose your driver and language
5. Copy the connection string (URI)
6. Replace `<username>` and `<password>` with your database credentials

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

## MongoDB Compass Installation

MongoDB Compass is the official GUI tool for MongoDB, making it easy to explore and manipulate your data.

### Installation Steps

1. Download MongoDB Compass from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
2. Choose your operating system (Windows, macOS, or Linux)
3. Run the installer and follow the setup wizard
4. Accept the license agreement and installation path
5. Click "Install" and wait for completion

### Connecting to Your Database

1. Open MongoDB Compass
2. Click "New Connection"
3. Enter your connection string in the URI field or use individual connection parameters:
   - **Hostname**: localhost (for local MongoDB)
   - **Port**: 27017 (default MongoDB port)
   - **Username**: your database username
   - **Password**: your database password
4. Click "Connect"
5. Browse your databases, collections, and documents in the left panel

For MongoDB Atlas, use the connection string provided in your cluster settings.

## mongosh (MongoDB Shell) Setup

mongosh is the modern MongoDB Shell for executing database queries and administrative commands.

### Installation

**Windows (via Chocolatey)**:
```bash
choco install mongosh
```

**macOS (via Homebrew)**:
```bash
brew install mongosh
```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-mongosh
```

### Connecting with mongosh

For local MongoDB:
```bash
mongosh
```

For MongoDB Atlas:
```bash
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname"
```

For specific host and port:
```bash
mongosh --host localhost --port 27017
```

### Basic mongosh Commands

```bash
# List all databases
show dbs

# Select a database
use myDatabase

# Show collections in current database
show collections

# Create a database (implicit when first document is inserted)
use newDatabase

# Insert a document
db.users.insertOne({ name: "John", age: 30 })

# Find documents
db.users.find()

# Exit mongosh
exit
```

## Environment Configuration

### Setting Up MongoDB Path

**Windows**:
1. Open Environment Variables (Search "Environment Variables" in Start Menu)
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Under System Variables, click "New"
5. Variable name: `MONGODB_HOME`
6. Variable value: `C:\Program Files\MongoDB\Server\7.0`
7. Add `%MONGODB_HOME%\bin` to the PATH variable
8. Click OK and restart Command Prompt

**macOS/Linux**:
Add to your shell profile (`~/.bash_profile` or `~/.zshrc`):
```bash
export MONGODB_HOME=/usr/local/mongodb
export PATH=$MONGODB_HOME/bin:$PATH
```

Then reload:
```bash
source ~/.bash_profile
```

### Configuration File

Create `mongod.conf` file to customize MongoDB behavior:

```yaml
# mongod.conf
net:
  port: 27017
  bindIp: 127.0.0.1

storage:
  dbPath: /var/lib/mongodb
  engine: wiredTiger

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

security:
  authorization: enabled
```

Start MongoDB with configuration:
```bash
mongod --config /path/to/mongod.conf
```

## Basic Security Setup

### Enable Authentication

1. Create an admin user first (when no authentication is enabled):
```bash
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "securePassword123",
  roles: ["root"]
})
exit
```

2. Edit `mongod.conf` to enable authentication:
```yaml
security:
  authorization: enabled
```

3. Restart MongoDB and connect with credentials:
```bash
mongosh -u admin -p --authenticationDatabase admin
```

### Create Database User

```bash
use myDatabase
db.createUser({
  user: "appuser",
  pwd: "appPassword123",
  roles: ["readWrite", "dbAdmin"]
})
```

### Connection String with Authentication

```
mongodb+srv://appuser:appPassword123@cluster0.xxxxx.mongodb.net/myDatabase
```

### Security Best Practices

- Use strong passwords (at least 12 characters with mixed case, numbers, and special characters)
- Restrict network access using IP whitelisting (especially important for production)
- Enable encryption at rest (available in Enterprise Edition)
- Use SSL/TLS for connections (enabled by default in MongoDB Atlas)
- Create users with minimal required permissions
- Regularly update MongoDB to the latest version
- Monitor and log all database activities
- Backup your databases regularly

### Firewall Configuration

For production deployments, restrict MongoDB port access:

```bash
# Linux (UFW)
sudo ufw allow from 192.168.1.0/24 to any port 27017

# Linux (iptables)
sudo iptables -A INPUT -s 192.168.1.0/24 -p tcp --dport 27017 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 27017 -j DROP
```

---

With these installation and setup steps completed, you're ready to start working with MongoDB and building your applications.