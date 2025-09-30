```user :
   + register : Ok
   + login : Ok
   + Get me : Ok
   + logout : Ok
   + refresh token :  in the end
   + forgot-password : OK
   + reset password : ok
   + update me : Ok
   + change password : Ok

admin :
  get user(pagination , filter for role , status) : Ok
  get user detail : Ok
  update user for admin : Ok
  delete user : Ok
```

```course :
  course (public):
  + list courses (pagination + filter + sort) : ok
  + search courses : ok
  + get course detail (Ok)

course (teacher):
  + create course (Ok)
  + update course : Ok
  + soft delete course : Ok

course (admin):
  + approve / reject course : Ok
  + force delete course : Ok
  + update any course : Ok

```

```Category :
  category (public):
  + list categories
  + get category detail


category (admin):
  + create category : ok
  + update category : ok
  + soft delete category : ok
  + force delete category : Ok
```

```chapter :
  + create chapter (admin / teacher) : Ok
  + Update chapter (admin/chapter) : Ok
  + Delete chapter (admin/chapter) : Ok
  + Get list chapter by course : Ok
```

---

```Lesson :
  lesson (admin/teacher):
  + create lesson (thuộc chapter cụ thể)
  + update lesson
  + delete lesson (soft delete)
  + reorder lessons trong chapter (optional)
  + get lesson detail (theo id hoặc slug)
  + list lessons by chapter

lesson (public):
  + get lesson detail (chỉ khi course đã Approved và user có quyền xem – ví dụ đã mua hoặc course free) : Pending
```
