# sati2023

```sh
sudo yum update -y
sudo yum install git -y

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
. ~/.nvm/nvm.sh
nvm install --lts

git clone https://github.com/italopessoa/sati2023.git
cd sati2023
npm install
```

# delete all resources
- kill instances
- delete nat gateway
- delete endpoint
- delete internet gateway
- delete route table
- delete acl
- delete subnet
- delete private sg
- delete public sg
- release elastic ip (try from ec2)
- delete dynamodb table
- delete ec2 iam role
