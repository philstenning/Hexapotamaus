import timeit


# from setup import  leg_1
setup_t = 'from leg_calculations_2 import calculate_angles'
val = timeit.timeit(
    setup=setup_t, stmt='calculate_angles(220,100,00)', number=150000)
# 0.00977420000000001 on my machine for 1440 runs
# around 1second on my machine for 150000 runs
print(val)

# each command of data is 8bits * 10 = 80 bits
# max bitrate is 115200 bps / 80 bits = 1440 commands per second

# each calculation takes about 0.000008 seconds
# 1440 commands take less than 120 milliseconds


# setup_t = 'from setup import  leg_1'
# val = timeit.timeit(
#     setup=setup_t, stmt='leg_1.get_motor_positions()', number=60)
# # 0.00977420000000001 on my machine for 1440 runs
# # around 1second on my machine for 150000 runs
# print(val)





