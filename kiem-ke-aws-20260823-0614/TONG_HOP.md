# Kiểm kê hạ tầng AWS — 3T EduTech

- Thời điểm: 2026-08-23 06:14 UTC
- Profile: `edutech-devops`
- Region: `ap-northeast-1`

> Bản này do `scripts/00-kiem-ke-he-thong-aws.sh` sinh ra. Toàn bộ là lệnh chỉ đọc.

### Đang chạy bằng danh tính nào

```
--------------------------------------------------------------------
|                         GetCallerIdentity                        |
+---------+--------------------------------------------------------+
|  Account|  552357225071                                          |
|  Arn    |  arn:aws:iam::552357225071:user/edutech-admin-devops   |
|  UserId |  AIDAYBGYOMJXRIHU7FJL5                                 |
+---------+--------------------------------------------------------+
```

### Máy chủ EC2

```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|                                                                                                            DescribeInstances                                                                                                            |
+-----------------+-------+-------------+---------------+----------------------+-----------------+--------------+-----------------------+---------------------------+-----------------------------+-------------+-------------------------+
|       AZ        |  IAM  | IP_Private  |   IP_Public   |         Id           |       Key       |    Loai      |          SG           |          Subnet           |             Ten             |  TrangThai  |           VPC           |
+-----------------+-------+-------------+---------------+----------------------+-----------------+--------------+-----------------------+---------------------------+-----------------------------+-------------+-------------------------+
|  ap-northeast-1a|  None |  10.0.1.114 |  None         |  i-0f8ac78807132b82d |  3t_edutech_aws |  g6.xlarge   |  sg-00c6d1043a1d2f58d |  subnet-0f9de968a59545f67 |  3T-EduTech-GPU-1-vLLM      |  stopped    |  vpc-0eba431f9dc3ee04b  |
|  ap-northeast-1a|  None |  10.0.1.85  |  None         |  i-0f6bcd18bd2c0f4eb |  3t_edutech_aws |  g4dn.xlarge |  sg-0ba227fea0379d189 |  subnet-0f9de968a59545f67 |  3T-EduTech-GPU-2-AIService |  stopped    |  vpc-0eba431f9dc3ee04b  |
|  ap-northeast-1a|  None |  10.0.1.9   |  18.178.30.57 |  i-01f5c3c164c11042e |  3t_edutech_aws |  t3.medium   |  sg-0dbefbd2d9eaad7b4 |  subnet-0f9de968a59545f67 |  3T-EduTech-CPU-EC2         |  stopped    |  vpc-0eba431f9dc3ee04b  |
+-----------------+-------+-------------+---------------+----------------------+-----------------+--------------+-----------------------+---------------------------+-----------------------------+-------------+-------------------------+
```

### Ổ đĩa EBS (dung lượng và gắn vào máy nào)

```
-------------------------------------------------------------------------------------------
|                                     DescribeVolumes                                     |
+-----+-----------------------+-------------------------+-------+------------+------------+
| GB  |        GanVao         |           Id            | Loai  |  ThietBi   | TrangThai  |
+-----+-----------------------+-------------------------+-------+------------+------------+
|  80 |  i-0f6bcd18bd2c0f4eb  |  vol-009a72d14612e47c1  |  gp3  |  /dev/sda1 |  in-use    |
|  30 |  i-01f5c3c164c11042e  |  vol-09bb0580d2a3e3ff6  |  gp3  |  /dev/sda1 |  in-use    |
|  150|  i-0f8ac78807132b82d  |  vol-0a0491105ba53f6d1  |  gp3  |  /dev/sda1 |  in-use    |
+-----+-----------------------+-------------------------+-------+------------+------------+
```

### Elastic IP

```
-------------------------------------------
|            DescribeAddresses            |
+----------+------------------------------+
|  AllocId |  eipalloc-0ae8404ed9d9b238d  |
|  ENI     |  eni-0660b6776d86c3fcf       |
|  GanVao  |  i-01f5c3c164c11042e         |
|  IP      |  18.178.30.57                |
+----------+------------------------------+
```

### VPC

```
-------------------------------------------------------------------------
|                             DescribeVpcs                              |
+---------------+-------------------------+----------+------------------+
|     CIDR      |           Id            | MacDinh  |       Ten        |
+---------------+-------------------------+----------+------------------+
|  10.0.0.0/16  |  vpc-0eba431f9dc3ee04b  |  False   |  3t-edutech-vpc  |
|  172.31.0.0/16|  vpc-0c1dc8f95719e0032  |  True    |  None            |
+---------------+-------------------------+----------+------------------+
```

### Subnet

```
------------------------------------------------------------------------------------------------------------------------------------------
|                                                             DescribeSubnets                                                            |
+-----------------+-----------------+---------------------------+------------------------------+---------------+-------------------------+
|       AZ        |      CIDR       |            Id             |             Ten              |  TuDongGanIP  |           VPC           |
+-----------------+-----------------+---------------------------+------------------------------+---------------+-------------------------+
|  ap-northeast-1a|  172.31.32.0/20 |  subnet-017bfed81ff3a89ac |  None                        |  True         |  vpc-0c1dc8f95719e0032  |
|  ap-northeast-1c|  172.31.0.0/20  |  subnet-062b6d93cf2f8fddf |  None                        |  True         |  vpc-0c1dc8f95719e0032  |
|  ap-northeast-1d|  172.31.16.0/20 |  subnet-0e0d9105ba7bf64e2 |  None                        |  True         |  vpc-0c1dc8f95719e0032  |
|  ap-northeast-1c|  10.0.20.0/24   |  subnet-00f2756290e2c5174 |  3t-edutech-private-subnet-2 |  False        |  vpc-0eba431f9dc3ee04b  |
|  ap-northeast-1a|  10.0.1.0/24    |  subnet-0f9de968a59545f67 |  3t-edutech-public-subnet-1  |  True         |  vpc-0eba431f9dc3ee04b  |
|  ap-northeast-1a|  10.0.10.0/24   |  subnet-0b1250f300b4e8716 |  3t-edutech-private-subnet-1 |  False        |  vpc-0eba431f9dc3ee04b  |
+-----------------+-----------------+---------------------------+------------------------------+---------------+-------------------------+
```

### Bảng định tuyến — có đường ra Internet không

```
--------------------------------------------------------------------------------------------------------------------------------
|                                                      DescribeRouteTables                                                     |
+-----------+------------------------+------------------------+---------+----------------------------+-------------------------+
|  DichDen  |          Id            |        QuaCong         | QuaNAT  |          Subnet            |           VPC           |
+-----------+------------------------+------------------------+---------+----------------------------+-------------------------+
|  None     |  rtb-00ca71124f6643a63 |  None                  |  None   |  None                      |  vpc-0eba431f9dc3ee04b  |
|  0.0.0.0/0|  rtb-0e2c581d74fb9774c |  igw-01c760f0208a5af74 |  None   |  subnet-0f9de968a59545f67  |  vpc-0eba431f9dc3ee04b  |
|  0.0.0.0/0|  rtb-0e4d70221f70ef2d4 |  igw-08c49492e2fa7d89b |  None   |  None                      |  vpc-0c1dc8f95719e0032  |
+-----------+------------------------+------------------------+---------+----------------------------+-------------------------+
```

### Security Group — danh sách

```
----------------------------------------------------------------------------------------------------------------
|                                            DescribeSecurityGroups                                            |
+----------------------+---------------------------------------------+---------------+-------------------------+
|          Id          |                    MoTa                     |      Ten      |           VPC           |
+----------------------+---------------------------------------------+---------------+-------------------------+
|  sg-0dbefbd2d9eaad7b4|  Security Group for CPU EC2 Control Tower   |  3t-cpu-ec2   |  vpc-0eba431f9dc3ee04b  |
|  sg-0c72aa22c2170af63|  Security Group for AWS RDS SQL Server      |  3t-rds       |  vpc-0eba431f9dc3ee04b  |
|  sg-00c6d1043a1d2f58d|  Security Group for GPU EC2 #1 vLLM Server  |  3t-gpu-ec2-1 |  vpc-0eba431f9dc3ee04b  |
|  sg-0ba227fea0379d189|  Security Group for GPU EC2 #2 AI Service   |  3t-gpu-ec2-2 |  vpc-0eba431f9dc3ee04b  |
|  sg-0ab29b26d422dec77|  default VPC security group                 |  default      |  vpc-0c1dc8f95719e0032  |
|  sg-0671c6e6fafe2ff20|  default VPC security group                 |  default      |  vpc-0eba431f9dc3ee04b  |
+----------------------+---------------------------------------------+---------------+-------------------------+
```

### Luật INGRESS trải phẳng (nguồn nào được vào cổng nào)

```

[sg-0dbefbd2d9eaad7b4	3t-cpu-ec2]
  tcp    80     80      cidr=0.0.0.0/0             sg=
  tcp    22     22      cidr=113.185.87.165/32,0.0.0.0/0,14.241.253.151/32,113.185.85.84/32  sg=
  tcp    443    443     cidr=0.0.0.0/0             sg=

[sg-0c72aa22c2170af63	3t-rds]
  tcp    1433   1433    cidr=sg-0dbefbd2d9eaad7b4  sg=

[sg-00c6d1043a1d2f58d	3t-gpu-ec2-1]
  tcp    22     22      cidr=113.185.87.165/32,113.185.77.205/32,116.109.35.130/32  sg=
  tcp    8000   8000    cidr=sg-0ba227fea0379d189  sg=

[sg-0ba227fea0379d189	3t-gpu-ec2-2]
  tcp    22     22      cidr=113.185.87.165/32,116.109.35.130/32  sg=
  tcp    2111   2111    cidr=sg-0dbefbd2d9eaad7b4  sg=

[sg-0ab29b26d422dec77	default]
  -1     None   None    cidr=sg-0ab29b26d422dec77  sg=

[sg-0671c6e6fafe2ff20	default]
  -1     None   None    cidr=sg-0671c6e6fafe2ff20  sg=
```

### RDS

```
------------------------------------------------------------------------------------
|                                DescribeDBInstances                               |
+-----------+----------------------------------------------------------------------+
|  AZ       |  ap-northeast-1c                                                     |
|  Ban      |  16.00.4095.4.v1                                                     |
|  Cong     |  1433                                                                |
|  CongKhai |  False                                                               |
|  Endpoint |  edutech-db-instance.cne6s0yw6b2b.ap-northeast-1.rds.amazonaws.com   |
|  Engine   |  sqlserver-ex                                                        |
|  Id       |  edutech-db-instance                                                 |
|  Loai     |  db.t3.micro                                                         |
|  MaHoa    |  False                                                               |
|  SG       |  sg-0c72aa22c2170af63                                                |
|  TaiKhoan |  edutech_admin                                                       |
|  TrangThai|  stopped                                                             |
|  VPC      |  vpc-0eba431f9dc3ee04b                                               |
+-----------+----------------------------------------------------------------------+
```

### Subnet group của RDS (RDS nằm ở subnet nào)

```
------------------------------------------------------------------
|                     DescribeDBSubnetGroups                     |
+---------+------------------------------------------------------+
|  Subnets|  subnet-00f2756290e2c5174,subnet-0b1250f300b4e8716   |
|  Ten    |  edutech-db-subnet-group                             |
|  VPC    |  vpc-0eba431f9dc3ee04b                               |
+---------+------------------------------------------------------+
```

### Load balancer

```
```

### Chứng chỉ ACM

```
```

### Hosted zone Route53

```
```

### S3 bucket

```
```

### Hạn mức vCPU cho instance dòng G (quyết định có bật được g6e không)

```
-------------------------------------------------------------
|                      GetServiceQuota                      |
+-------+---------+-----------------------------------------+
| DonVi | GiaTri  |                   Ten                   |
+-------+---------+-----------------------------------------+
|  None |  8.0    |  Running On-Demand G and VT instances   |
+-------+---------+-----------------------------------------+
```

### Chi phí 14 ngày gần nhất, gộp theo dịch vụ

```
  AmazonCloudWatch                                    0.00 USD
  EC2                                                 0.00 Other
  Amazon                                              0.00 Private
  Amazon                                              0.00 Storage
  Amazon                                              0.00 Queue
  Amazon                                              0.00 Notification
  Amazon                                              0.00 Database
  Amazon                                              0.00 Compute
  AWS                                                 0.00 Manager
  AWS                                                 0.00 Management
  AWS                                                 0.00 0
  AWS                                                 0.00 Transfer
```

## Kiểm tra thông mạng (chạy từ máy đang thực thi script)

```
RDS endpoint: edutech-db-instance.cne6s0yw6b2b.ap-northeast-1.rds.amazonaws.com:1433
  DNS phân giải : 10.0.20.238     edutech-db-instance.cne6s0yw6b2b.ap-northeast-1.rds.amazonaws.com
  TCP mở cổng   : ĐÓNG ❌ (Security Group hoặc VPC sai — chưa cần nghĩ tới mật khẩu)

Máy này ra Internet được không (cần cho docker pull):
  registry-1.docker.io:443 : MỞ ✅
  mcr.microsoft.com:443    : MỞ ✅
```
