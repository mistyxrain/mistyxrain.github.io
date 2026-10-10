---
title: "linux下R和Rstudio安装和配置、以及Rglpk包的安装"
description: "其实Rstudio公司是有提供免费的Rstudio server云服务的。只需要注册一个账号就行了 但是免费的CPU比较差，而且数据保存时间也很短。 安装R sudo yum install R -y R #启动R q() #..."
pubDate: 2021-09-11
heroImage: ../../assets/posts/linux-xia-r-he-rstudio-an-zhuang-he-pei-zhi-yi-ji-rglpk-bao-de-an-zhuang.jpg
tags: ["linux","R"]
---

其实Rstudio公司是有提供免费的Rstudio server云服务的。**只需要注册一个账号就行了**  
但是免费的CPU比较差，而且数据保存时间也很短。

#### 安装R

```shell
sudo yum install R -y

R     #启动R
q()   #退出
```

#### 安装linux

这个时候先看当前的linux版本——查看是centos7还是8

```shell
ll /etc/*centos*
cat /etc/centos-release
```

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827152419-6b7ag0g.png)

参考这个官方链接

[Download RStudio Server for Red Hat/CentOS](https://www.rstudio.com/products/rstudio/download-server/)

```shell
wget https://download2.rstudio.org/server/centos8/x86_64/rstudio-server-rhel-1.4.1717-x86_64.rpm
sudo yum install rstudio-server-rhel-1.4.1717-x86_64.rpm
```

##### 通过浏览器访问Rstudio server

通过在浏览器输入地址即可登录

```shell
http://<server-ip>:8787
# 其中<server-ip>为服务器外网登录地址
```

#### 如果无法访问

如果遇到无法通过浏览器登录的情况，那么就需要经过一些折腾

比如设置权限

```shell
chown rstudio-server /usr/lib/systemd/system/rstudio-server.service
更改文件的权限为rstudio-server
```

比如公开端口，配置防火墙等等

[How to Install RStudio Server on CentOS 7](https://www.vultr.com/docs/how-to-install-rstudio-server-on-centos-7)

[Rstudio-server 浏览器打不开8787端口？](https://www.zhihu.com/question/47784194)

[Rstudio Server的安装和使用（附常见问题）](https://www.jianshu.com/p/d3509ff51e90)

[Linux学习—退出vi编辑模式](https://blog.csdn.net/u010648555/article/details/50676647)

[https://www.cnblogs.com/xuanlvshu/p/5721254.html](https://www.cnblogs.com/xuanlvshu/p/5721254.html)

但我只是管理员通过了我的端口，就能顺利登录了

#### 设置账户并登录

```shell
useradd 用户名
passwd 用户名 # 即修改改用户名的密码
输入1次密码
retype密码
```

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827153528-1u0nkgs.png)

注意，当在输入密码的时候，是不可见的

需要输入两次相同的密码

> 用户名为xu
> 
> 密码为wwwxuan1

在浏览器登录后即可开始操作

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827154001-1potasu.png)

界面还是挺友好的

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827154117-pq54e3x.png)

### 新问题

`Rglpk`包无法安装

安装即出现报错

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827201645-li6t2ed.png)

怀疑可能是权限的问题?

看网上也有不少人在问，见这个帖子

[GLPK: No such file or directory error when trying to install R package](https://stackoverflow.com/questions/25114771/glpk-no-such-file-or-directory-error-when-trying-to-install-r-package)

其实

```shell
sudo apt-get install libglpk-dev
```

这个方法很有可能是对的，只是因为我没有这个apr工具  
如果要安装apt这个工具，请看[centos安装apt-get](https://blog.csdn.net/zhou_438/article/details/103671617)

c

Zhiying Cui的答案是对的，但是很繁琐，而且在并行的代码中，由于`foreach`的`.package`参数需要传入包，这个时候就会出问题

所以请在终端输入命令

```shell
yum install glpk-devel
```

在Rstudio中输入

```r
install.packages("Rglpk")
```

一切就ok了

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827203733-mcu2t85.png)

### 一些tip

1另外，linux对大小写敏感，所以当我们`source("xxx.R")`的时候，注意下后缀名`.R`的大小写和实际文件名是否相同，不同的话，就会报错的

2关于权限和所属的问题的问题

如果出现无法读取文件，或者修改R code 无法保存，必须保存为副本的情况，则按如下操作

由于我的Rstudio的用户是xu，所以

```r
chmod 777 /home/xu/DEAF  #赋予读写权限

usermod -g root xu # 赋予xu用户权限

sudo chown -R xu:xu DEAF #把所属改为xu用户

chown root /usr/lib/systemd/system/rstudio-server.service # 这个软件所属改为root
```

最好重启下，方便生效

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827204918-djvljmf.png)

中间绕的弯路不知道有多少，总之，感谢艾阳兄~！

如果觉得页面太小，可以考虑用F11，直接全屏或退出

### Xshell修改配色

如果，对当前的会话进行修改 ，如今Xshell已经是免费的了

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827205030-3el5kvx.png)

![image.png](https://b3logfile.com/siyuan/1606452548425/assets/image-20210827205400-mom98c7.png)

对于Xftp，只要拖动文件，就能完成上传

### yum工具

如下命令

```r
yum search glpk
# 搜索glpk
yum install glpk_xxx
# 从搜索到的软件中选一个安装
```
