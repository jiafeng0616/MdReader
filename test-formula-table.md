# 数学公式与复杂表格测试文档

## 一、数学公式渲染测试

### 1.1 行内公式

这是一个行内公式示例：$E = mc^2$，其中 $E$ 表示能量，$m$ 表示质量，$c$ 是光速。

质能方程 $E = mc^2$ 是爱因斯坦最著名的公式之一。

### 1.2 块级公式

**二次方程求根公式：**

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

**欧拉公式：**

$$e^{i\pi} + 1 = 0$$

**高斯积分：**

$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

**泰勒展开：**

$$e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots$$

**矩阵表示：**

$$A = \begin{pmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & \ddots & \vdots \\ a_{m1} & a_{m2} & \cdots & a_{mn} \end{pmatrix}$$

---

## 二、复杂表格测试（10列 + 长URL）

### 2.1 算法性能对比表

| 算法名称 | 时间复杂度 | 空间复杂度 | 稳定性 | 适用场景 | 实现难度 | GitHub仓库 | 文档链接 | Stars | 最后更新 |
|---------|-----------|-----------|-------|---------|---------|-----------|---------|-------|---------|
| QuickSort | $O(n \log n)$ | $O(\log n)$ | 不稳定 | 通用排序 | 中等 | https://github.com/TheAlgorithms/Python/blob/master/sorts/quick_sort.py | https://en.wikipedia.org/wiki/Quicksort#Complex_analysis | 15.2k | 2024-01 |
| MergeSort | $O(n \log n)$ | $O(n)$ | 稳定 | 链表排序 | 中等 | https://github.com/TheAlgorithms/Python/blob/master/sorts/merge_sort.py | https://en.wikipedia.org/wiki/Merge_sort | 15.2k | 2024-01 |
| HeapSort | $O(n \log n)$ | $O(1)$ | 不稳定 | 内存受限 | 较难 | https://github.com/TheAlgorithms/Python/blob/master/sorts/heap_sort.py | https://en.wikipedia.org/wiki/Heapsort | 15.2k | 2024-01 |
| BubbleSort | $O(n^2)$ | $O(1)$ | 稳定 | 教学演示 | 简单 | https://github.com/TheAlgorithms/Python/blob/master/sorts/bubble_sort.py | https://en.wikipedia.org/wiki/Bubble_sort | 15.2k | 2024-01 |
| InsertionSort | $O(n^2)$ | $O(1)$ | 稳定 | 小规模数据 | 简单 | https://github.com/TheAlgorithms/Python/blob/master/sorts/insertion_sort.py | https://en.wikipedia.org/wiki/Insertion_sort | 15.2k | 2024-01 |
| TimSort | $O(n \log n)$ | $O(n)$ | 稳定 | 实际应用 | 复杂 | https://github.com/python/cpython/blob/main/Objects/listsort.txt | https://en.wikipedia.org/wiki/Timsort | 55.8k | 2024-01 |
| RadixSort | $O(nk)$ | $O(n+k)$ | 稳定 | 整数排序 | 中等 | https://github.com/TheAlgorithms/Python/blob/master/sorts/radix_sort.py | https://en.wikipedia.org/wiki/Radix_sort | 15.2k | 2024-01 |
| CountingSort | $O(n+k)$ | $O(k)$ | 稳定 | 小范围整数 | 简单 | https://github.com/TheAlgorithms/Python/blob/master/sorts/counting_sort.py | https://en.wikipedia.org/wiki/Counting_sort | 15.2k | 2024-01 |
| ShellSort | $O(n \log^2 n)$ | $O(1)$ | 不稳定 | 中等规模 | 中等 | https://github.com/TheAlgorithms/Python/blob/master/sorts/shell_sort.py | https://en.wikipedia.org/wiki/Shellsort | 15.2k | 2024-01 |

### 2.2 机器学习模型对比表

| 模型名称 | 参数量 | 训练时间 | 准确率 | 损失函数 | 优化器 | 论文链接 | 代码仓库 | 推理速度 | GPU显存 | 发布年份 |
|---------|-------|---------|-------|---------|-------|---------|---------|---------|--------|---------|
| ResNet-50 | $25.6M$ | 2h | $92.1\%$ | CrossEntropy | SGD | https://arxiv.org/abs/1512.03385 | https://github.com/pytorch/vision/blob/main/torchvision/models/resnet.py | 5ms | 2GB | 2015 |
| VGG-16 | $138M$ | 8h | $91.5\%$ | CrossEntropy | Adam | https://arxiv.org/abs/1409.1556 | https://github.com/pytorch/vision/blob/main/torchvision/models/vgg.py | 8ms | 4GB | 2014 |
| Inception-v3 | $23.8M$ | 3h | $93.5\%$ | CrossEntropy | RMSProp | https://arxiv.org/abs/1512.00567 | https://github.com/pytorch/vision/blob/main/torchvision/models/inception.py | 6ms | 3GB | 2015 |
| EfficientNet-B0 | $5.3M$ | 1.5h | $94.1\%$ | CrossEntropy | Adam | https://arxiv.org/abs/1905.11946 | https://github.com/google/automl/blob/master/efficientnet/model.py | 3ms | 1GB | 2019 |
| BERT-Base | $110M$ | 24h | $88.5\%$ | MaskedLM | AdamW | https://arxiv.org/abs/1810.04805 | https://github.com/google-research/bert/blob/master/modeling.py | 10ms | 4GB | 2018 |
| GPT-2 | $1.5B$ | 72h | $90.2\%$ | LM | Adam | https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf | https://github.com/openai/gpt-2/blob/master/src/model.py | 20ms | 8GB | 2019 |

### 2.3 数学公式在表格中的渲染

| 公式名称 | LaTeX 表达式 | 说明 | 应用领域 |
|---------|-------------|------|---------|
| 勾股定理 | $a^2 + b^2 = c^2$ | 直角三角形三边关系 | 几何学 |
| 二次方程求根 | $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ | 一元二次方程解 | 代数 |
| 欧拉恒等式 | $e^{i\pi} + 1 = 0$ | 数学中最美的公式 | 复分析 |
| 泰勒展开 | $f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n$ | 函数近似 | 微积分 |
| 柯西积分公式 | $f(a) = \frac{1}{2\pi i} \oint_\gamma \frac{f(z)}{z-a} dz$ | 复变函数积分 | 复分析 |
| 高斯分布 | $f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$ | 正态概率密度 | 统计学 |

---

## 三、混合内容测试

### 3.1 算法复杂度分析

在分析算法复杂度时，我们经常使用大O表示法。例如：

- 快速排序的平均时间复杂度为 $O(n \log n)$
- 冒泡排序的时间复杂度为 $O(n^2)$
- 二分查找的时间复杂度为 $O(\log n)$

对于递归算法，我们可以使用**主定理**（Master Theorem）来分析：

$$T(n) = aT\left(\frac{n}{b}\right) + O(n^d)$$

其中 $a \geq 1$，$b > 1$，$d \geq 0$。

### 3.2 机器学习损失函数

常见的损失函数包括：

1. **交叉熵损失（Cross-Entropy Loss）：**
   $$L = -\sum_{i=1}^{n} y_i \log(\hat{y}_i)$$

2. **均方误差（MSE）：**
   $$L = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$$

3. **KL散度：**
   $$D_{KL}(P || Q) = \sum_{i} P(i) \log \frac{P(i)}{Q(i)}$$

---

## 四、嵌套列表测试

1. 第一级项目
   - 第二级项目
     - 第三级项目 $x^2 + y^2 = r^2$
       - 第四级项目
   - 另一个第二级项目
2. 另一个第一级项目

---

## 五、代码块测试

```python
import numpy as np

def gaussian(x, mu, sigma):
    """高斯分布函数"""
    return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma) ** 2)

# 计算高斯分布
x = np.linspace(-5, 5, 100)
y = gaussian(x, mu=0, sigma=1)
```

---

## 六、引用测试

> "数学是科学的女王，而数论是数学的女王。"
> —— 卡尔·弗里德里希·高斯

> "在数学中，你永远不会理解事物。你只是习惯它们。"
> —— 约翰·冯·诺伊曼

---

## 七、脚注测试

这是一个带脚注的段落[^1]。

[^1]: 这是脚注的内容，用于补充说明。

---

## 八、表格与公式综合测试

### 8.1 物理常数表

| 常数名称 | 符号 | 数值 | 单位 | 计算公式 | 误差范围 | 发现者 | 年份 | 重要性 | 应用场景 | 相关链接 |
|---------|------|-----|------|---------|---------|-------|------|-------|---------|---------|
| 光速 | $c$ | $299792458$ | $m/s$ | $c = \frac{1}{\sqrt{\mu_0 \epsilon_0}}$ | 精确值 | 基尔霍夫 | 1857 | ★★★★★ | 相对论 | https://physics.nist.gov/cgi-bin/cuu/Value?c |
| 普朗克常数 | $h$ | $6.62607015 \times 10^{-34}$ | $J \cdot s$ | $E = h\nu$ | 精确值 | 普朗克 | 1900 | ★★★★★ | 量子力学 | https://physics.nist.gov/cgi-bin/cuu/Value?h |
| 万有引力常数 | $G$ | $6.67430 \times 10^{-11}$ | $N \cdot m^2/kg^2$ | $F = G\frac{m_1 m_2}{r^2}$ | $\pm 0.00015$ | 卡文迪许 | 1798 | ★★★★☆ | 引力计算 | https://physics.nist.gov/cgi-bin/cuu/Value?bg |
| 玻尔兹曼常数 | $k_B$ | $1.380649 \times 10^{-23}$ | $J/K$ | $PV = Nk_BT$ | 精确值 | 玻尔兹曼 | 1877 | ★★★★☆ | 热力学 | https://physics.nist.gov/cgi-bin/cuu/Value?k |

### 8.2 数据结构性能对比

| 数据结构 | 插入 | 删除 | 查找 | 空间 | 平衡性 | 实现复杂度 | 适用场景 | 线程安全 | 持久化 | 并发性能 |
|---------|------|------|------|------|-------|-----------|---------|---------|-------|---------|
| 数组 | $O(1)$ | $O(n)$ | $O(n)$ | $O(n)$ | N/A | 简单 | 随机访问 | 否 | 支持 | 低 |
| 链表 | $O(1)$ | $O(1)$ | $O(n)$ | $O(n)$ | N/A | 简单 | 频繁插入删除 | 否 | 支持 | 中 |
| 二叉搜索树 | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ | $O(n)$ | 可能失衡 | 中等 | 有序数据 | 否 | 支持 | 中 |
| 红黑树 | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ | $O(n)$ | 始终平衡 | 复杂 | 通用平衡树 | 否 | 支持 | 中 |
| 哈希表 | $O(1)$ | $O(1)$ | $O(1)$ | $O(n)$ | N/A | 中等 | 快速查找 | 部分支持 | 不支持 | 高 |

---

## 九、超长表格（测试横向滚动）

| ID | Name | Description | Category | Price | Stock | URL | Documentation | Rating | Reviews | Created At | Updated At |
|----|------|-------------|----------|-------|-------|-----|---------------|--------|---------|------------|------------|
| 1 | Product A | A very long product description that goes on and on to test how the table handles long text content in cells | Electronics | $99.99 | 150 | https://www.example.com/products/very-long-product-url-that-tests-scrolling/12345?ref=homepage&category=electronics&sort=price_asc | https://docs.example.com/api/v1/products/12345/authentication/methods/oauth2/flows/authorization_code/grant_types | 4.5 | 234 | 2024-01-01 | 2024-01-15 |
| 2 | Product B | Another extremely long description for testing purposes | Clothing | $49.99 | 300 | https://www.example.com/products/another-very-long-url/67890?ref=sidebar&category=clothing&filter=red | https://docs.example.com/api/v1/products/67890/authentication/methods/api_key/headers | 4.2 | 156 | 2024-01-02 | 2024-01-16 |
| 3 | Product C | Yet another long description | Books | $29.99 | 500 | https://www.example.com/products/yet-another-long-url/11111?ref=footer&category=books&sort=rating | https://docs.example.com/api/v1/products/11111/authentication/methods/oauth2/flows/client_credentials | 4.8 | 567 | 2024-01-03 | 2024-01-17 |
| 4 | Product D | One more long description | Sports | $79.99 | 75 | https://www.example.com/products/one-more-long-url/22222?ref=main&category=sports&filter=nike | https://docs.example.com/api/v1/products/22222/authentication/methods/oauth2/flows/implicit | 4.1 | 89 | 2024-01-04 | 2024-01-18 |
| 5 | Product E | Final long description | Home | $199.99 | 25 | https://www.example.com/products/final-long-url/33333?ref=top&category=home&sort=newest | https://docs.example.com/api/v1/products/33333/authentication/methods/oauth2/flows/password | 4.6 | 345 | 2024-01-05 | 2024-01-19 |

---

## 十、测试总结

本文档测试了以下功能：

1. ✅ 数学公式渲染（行内和块级）
2. ✅ 复杂表格（10列）
3. ✅ 长URL在表格中的显示
4. ✅ 表格中的数学公式
5. ✅ 暗黑模式兼容性
6. ✅ 嵌套列表
7. ✅ 代码块
8. ✅ 引用
9. ✅ 脚注
10. ✅ 混合内容

---

*最后更新：2024年1月*
